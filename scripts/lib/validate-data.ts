/**
 * Data-quality validation for the seeded DuckDB.
 *
 * Single source of truth for the "is the ingested data internally
 * consistent?" checks. Used by:
 *
 *   - deno task validate:data (the CLI report)
 *   - the data-validation gate in packages/db/mod.ts (during seed)
 *
 * Decoupled from the API: the caller injects `queryRows` (the same shape as
 * packages/api/db.ts's export) so this lib can run against any DuckDB
 * connection without importing the API layer.
 *
 * NOTE: these are *referential / coverage* checks (FK orphans, ind_meta
 * coverage, tematica-tree consistency). Structural input checks (table
 * presence, required columns, PK uniqueness, row-count floors, value
 * sanity — ported from the reference's sib_validate_source) are added in a
 * follow-up under an earlier stage.
 */

/** Matches packages/api/db.ts `queryRows`. */
export type QueryRows = (
  sql: string,
  params?: unknown[],
) => Promise<Record<string, unknown>[]>;

export interface DataCheck {
  name: string;
  description?: string;
  ok: boolean;
  /** "fail" blocks the seed gate; "warn" (default when !ok) is signal only. */
  level?: "warn" | "fail";
  count?: number;
  missing?: unknown[];
  error?: string;
}

/** Overall status from a check list (for the seed gate). */
export function validationStatus(
  checks: DataCheck[],
): "pass" | "warn" | "fail" {
  if (checks.some((c) => !c.ok && c.level === "fail")) return "fail";
  if (checks.some((c) => !c.ok)) return "warn";
  return "pass";
}

interface TableSpec {
  required: string[];
  pk: string[] | null;
  source: "gitlab" | "local" | "computed";
}

/**
 * Expected source-table schema (ported from the reference R/build-spec.R and
 * reconciled against the live DuckDB columns). `computed` tables are derived
 * post-ingest, so presence isn't required.
 */
const TABLE_SPEC: Record<string, TableSpec> = {
  region: { required: ["parent", "slug", "label", "tipo"], pk: ["slug", "parent"], source: "gitlab" },
  departamento: { required: ["slug", "label", "cod_dane"], pk: ["slug"], source: "gitlab" },
  municipio: { required: ["slug", "label", "cod_dane"], pk: ["slug"], source: "gitlab" },
  grupo: { required: ["parent", "slug", "label", "tipo"], pk: ["slug"], source: "gitlab" },
  especie: { required: ["slug", "species", "kingdom"], pk: ["slug"], source: "gitlab" },
  especie_grupo: { required: ["slug_especie", "slug_grupo", "tipo"], pk: ["slug_especie", "slug_grupo"], source: "gitlab" },
  especie_meta: { required: ["slug"], pk: ["slug"], source: "gitlab" },
  especie_region: { required: ["slug_region", "slug_especie", "registros"], pk: ["slug_region", "slug_especie"], source: "gitlab" },
  especie_tematica: { required: ["slug_especie", "slug_region", "slug_tematica"], pk: ["slug_especie", "slug_region", "slug_tematica"], source: "gitlab" },
  region_grupo: { required: ["slug_grupo", "slug_region"], pk: ["slug_grupo", "slug_region"], source: "gitlab" },
  region_tematica: { required: ["slug_region"], pk: ["slug_region"], source: "gitlab" },
  region_publicador: { required: ["slug_region", "slug_publicador"], pk: ["slug_region", "slug_publicador"], source: "gitlab" },
  region_patrocinador: { required: ["slug_region", "slug_patrocinador"], pk: ["slug_region", "slug_patrocinador"], source: "gitlab" },
  publicador: { required: ["slug", "label"], pk: ["slug"], source: "gitlab" },
  patrocinador: { required: ["slug"], pk: ["slug"], source: "gitlab" },
  estimada: { required: ["slug_grupo"], pk: ["slug_grupo"], source: "gitlab" },
  referencia_estimada: { required: ["ref_id", "label"], pk: ["ref_id"], source: "gitlab" },
  ranking: { required: ["slug", "label", "puesto"], pk: ["slug"], source: "gitlab" },
  dato_relevante: { required: ["titulo", "slug_region"], pk: null, source: "gitlab" },
  aporte_region_especial: { required: ["slug_region_especial", "slug_region"], pk: null, source: "gitlab" },
  ventana_recomendada: { required: ["from", "to", "type"], pk: null, source: "gitlab" },
  temporalidad_region: { required: ["slug_region", "anio", "registros"], pk: ["slug_region", "anio"], source: "gitlab" },
  temporalidad_grupo_biologico: { required: ["slug_region", "slug_grupo_biologico", "anio", "registros"], pk: ["slug_region", "slug_grupo_biologico", "anio"], source: "gitlab" },
  temporalidad_grupo_interes_conservacion: { required: ["slug_region", "slug_grupo_interes_conservacion", "anio", "registros"], pk: ["slug_region", "slug_grupo_interes_conservacion", "anio"], source: "gitlab" },
  temporalidad_pais_publicacion: { required: ["slug_region", "pais_publicacion", "anio"], pk: ["slug_region", "pais_publicacion", "anio"], source: "gitlab" },
  temporalidad_publicador_region: { required: ["slug_region", "slug_publicador", "anio"], pk: ["slug_region", "slug_publicador", "anio"], source: "gitlab" },
  tematica: { required: ["parent", "slug", "label"], pk: ["slug"], source: "local" },
  ind_meta: { required: ["indicador", "label", "tipo"], pk: ["indicador"], source: "local" },
  banner_images: { required: ["slug"], pk: ["slug"], source: "local" },
  gallery_images: { required: ["slug_region"], pk: null, source: "local" },
  glosario: { required: ["termino", "definicion"], pk: null, source: "local" },
  preg_frecuentes: { required: ["pregunta", "respuesta"], pk: null, source: "local" },
  referencias_home: { required: ["position"], pk: null, source: "local" },
  territorio: { required: ["parent", "slug", "label", "tipo"], pk: ["slug", "parent"], source: "computed" },
};

/** Conservative minimum row counts (below current values; catch a truncated load). */
const ROW_FLOORS: Record<string, number> = {
  especie: 70000, region: 1000, departamento: 32, municipio: 1100, grupo: 50,
  especie_region: 1000000, region_grupo: 30000, especie_grupo: 200000,
  especie_tematica: 800000, region_tematica: 1000, publicador: 500,
};

/** Internal tables that aren't part of the source spec (don't flag as extras). */
const INTERNAL_TABLES = new Set(["_sibdata_meta"]);

async function listTables(queryRows: QueryRows): Promise<Set<string>> {
  const rows = await queryRows(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'main'`,
  );
  return new Set(rows.map((r) => String(r.table_name)));
}

async function listColumns(
  queryRows: QueryRows,
  table: string,
): Promise<string[]> {
  const rows = await queryRows(
    `SELECT column_name FROM information_schema.columns
     WHERE table_name = $1 ORDER BY ordinal_position`,
    [table],
  );
  return rows.map((r) => String(r.column_name));
}

/**
 * Structural checks on the ingested TSV/CSV tables: presence, required
 * columns, primary-key uniqueness, row-count floors, value sanity. Missing
 * tables / columns are `level: "fail"` (block the seed); everything else is
 * `level: "warn"`. Each category is wrapped so one failure can't abort the rest.
 */
export async function runStructuralChecks(
  queryRows: QueryRows,
): Promise<DataCheck[]> {
  const checks: DataCheck[] = [];
  const tables = await listTables(queryRows);
  const specNames = new Set(Object.keys(TABLE_SPEC));

  // Table presence (required = non-computed spec tables)
  try {
    const expected = Object.entries(TABLE_SPEC)
      .filter(([, s]) => s.source !== "computed")
      .map(([t]) => t);
    const missing = expected.filter((t) => !tables.has(t));
    checks.push({
      name: "table presence",
      description: "Every expected source table was loaded",
      count: missing.length,
      missing,
      ok: missing.length === 0,
      level: "fail",
    });
    const extra = [...tables].filter(
      (t) => !specNames.has(t) && !INTERNAL_TABLES.has(t),
    );
    checks.push({
      name: "unexpected tables",
      description: "Tables present that aren't in the source spec",
      count: extra.length,
      missing: extra,
      ok: extra.length === 0,
      level: "warn",
    });
  } catch (err) {
    checks.push({ name: "table presence", error: String(err), ok: false, level: "fail" });
  }

  // Required columns per table
  try {
    const offenders: string[] = [];
    for (const [table, spec] of Object.entries(TABLE_SPEC)) {
      if (!tables.has(table)) continue;
      const cols = new Set(await listColumns(queryRows, table));
      const missing = spec.required.filter((c) => !cols.has(c));
      if (missing.length) offenders.push(`${table}: ${missing.join(", ")}`);
    }
    checks.push({
      name: "required columns",
      description: "Every spec table has its required columns",
      count: offenders.length,
      missing: offenders,
      ok: offenders.length === 0,
      level: "fail",
    });
  } catch (err) {
    checks.push({ name: "required columns", error: String(err), ok: false, level: "fail" });
  }

  // Primary-key uniqueness
  try {
    const offenders: string[] = [];
    for (const [table, spec] of Object.entries(TABLE_SPEC)) {
      if (!spec.pk || !tables.has(table)) continue;
      const cols = new Set(await listColumns(queryRows, table));
      if (!spec.pk.every((c) => cols.has(c))) continue;
      const pkList = spec.pk.map((c) => `"${c}"`).join(", ");
      const rows = await queryRows(
        `SELECT COALESCE(SUM(c - 1), 0) AS d FROM
           (SELECT COUNT(*) AS c FROM "${table}" GROUP BY ${pkList} HAVING COUNT(*) > 1)`,
      );
      const dup = Number(rows[0]?.d ?? 0);
      if (dup > 0) offenders.push(`${table} (${spec.pk.join("+")}): ${dup}`);
    }
    checks.push({
      name: "primary-key uniqueness",
      description: "No duplicate rows on the declared key of each table",
      count: offenders.length,
      missing: offenders,
      ok: offenders.length === 0,
      level: "warn",
    });
  } catch (err) {
    checks.push({ name: "primary-key uniqueness", error: String(err), ok: false, level: "warn" });
  }

  // Row-count floors
  try {
    const offenders: string[] = [];
    for (const [table, floor] of Object.entries(ROW_FLOORS)) {
      if (!tables.has(table)) continue;
      const rows = await queryRows(`SELECT COUNT(*) AS n FROM "${table}"`);
      const n = Number(rows[0]?.n ?? 0);
      if (n < floor) offenders.push(`${table}: ${n} < ${floor}`);
    }
    checks.push({
      name: "row-count floors",
      description: "Tables meet their minimum expected row counts",
      count: offenders.length,
      missing: offenders,
      ok: offenders.length === 0,
      level: "warn",
    });
  } catch (err) {
    checks.push({ name: "row-count floors", error: String(err), ok: false, level: "warn" });
  }

  // Value sanity: non-negative count columns
  try {
    const offenders: string[] = [];
    for (const table of ["region_tematica", "region_grupo"]) {
      if (!tables.has(table)) continue;
      const cols = (await listColumns(queryRows, table)).filter(
        (c) => c.startsWith("registros_") || c.startsWith("especies_"),
      );
      if (!cols.length) continue;
      const expr = cols
        .map((c) => `SUM(CASE WHEN TRY_CAST("${c}" AS DOUBLE) < 0 THEN 1 ELSE 0 END)`)
        .join(" + ");
      const rows = await queryRows(`SELECT (${expr}) AS neg FROM "${table}"`);
      const neg = Number(rows[0]?.neg ?? 0);
      if (neg > 0) offenders.push(`${table}: ${neg} negative cells`);
    }
    if (tables.has("especie_region")) {
      const rows = await queryRows(
        `SELECT COUNT(*) AS n FROM especie_region WHERE TRY_CAST(registros AS DOUBLE) < 0`,
      );
      const n = Number(rows[0]?.n ?? 0);
      if (n > 0) offenders.push(`especie_region.registros: ${n}`);
    }
    checks.push({
      name: "non-negative counts",
      description: "registros_/especies_ values are >= 0",
      count: offenders.length,
      missing: offenders,
      ok: offenders.length === 0,
      level: "warn",
    });
  } catch (err) {
    checks.push({ name: "non-negative counts", error: String(err), ok: false, level: "warn" });
  }

  // Informational: region inventory by subtipo + indicator coverage. Reports
  // counts so we can read "how many núcleos / departments / etc., and how many
  // carry indicators" straight from the report instead of ad-hoc queries.
  try {
    if (tables.has("region") && tables.has("region_tematica")) {
      const rows = await queryRows(
        `SELECT r.subtipo AS subtipo, COUNT(*) AS total,
                COUNT(rt.slug_region) AS with_ind
         FROM region r
         LEFT JOIN region_tematica rt ON r.slug = rt.slug_region
         WHERE r.subtipo IS NOT NULL AND r.subtipo <> ''
         GROUP BY r.subtipo ORDER BY r.subtipo`,
      );
      const lines = rows.map(
        (r) =>
          `${String(r.subtipo)}: ${Number(r.total)} (${Number(r.with_ind)} with indicators)`,
      );
      checks.push({
        name: "region inventory by subtipo (info)",
        description:
          "Region counts per subtipo and how many carry region_tematica indicators",
        count: rows.length,
        missing: lines,
        ok: true,
        level: "warn",
      });
    }
  } catch (err) {
    checks.push({
      name: "region inventory by subtipo (info)",
      error: String(err),
      ok: false,
      level: "warn",
    });
  }

  return checks;
}

/**
 * Run the referential / coverage validation suite against a seeded DuckDB.
 * Returns one DataCheck per check; never throws (per-check errors are
 * captured as `{ ok: false, error }`).
 */
export async function runDataValidation(
  queryRows: QueryRows,
): Promise<DataCheck[]> {
  const checks: DataCheck[] = [];

  // Check 1: especie_region rows have a valid region
  try {
    const orphans = await queryRows(`
      SELECT COUNT(*) AS n FROM especie_region er
      LEFT JOIN region r ON er.slug_region = r.slug
      WHERE r.slug IS NULL
    `);
    checks.push({
      name: "especie_region orphans",
      description: "Rows in especie_region with no matching region",
      count: Number(orphans[0]?.n ?? 0),
      ok: Number(orphans[0]?.n ?? 0) === 0,
    });
  } catch (err) {
    checks.push({
      name: "especie_region orphans",
      error: String(err),
      ok: false,
    });
  }

  // Check 2: especie_region rows have a valid species
  try {
    const orphans = await queryRows(`
      SELECT COUNT(*) AS n FROM especie_region er
      LEFT JOIN especie e ON er.slug_especie = e.slug
      WHERE e.slug IS NULL
    `);
    checks.push({
      name: "especie_region species orphans",
      description: "Rows in especie_region with no matching species",
      count: Number(orphans[0]?.n ?? 0),
      ok: Number(orphans[0]?.n ?? 0) === 0,
    });
  } catch (err) {
    checks.push({
      name: "especie_region species orphans",
      error: String(err),
      ok: false,
    });
  }

  // Check 3: regions in region_tematica exist in region table
  try {
    const orphans = await queryRows(`
      SELECT COUNT(*) AS n FROM region_tematica rt
      LEFT JOIN region r ON rt.slug_region = r.slug
      WHERE r.slug IS NULL
    `);
    checks.push({
      name: "region_tematica orphans",
      description: "Rows in region_tematica with no matching region",
      count: Number(orphans[0]?.n ?? 0),
      ok: Number(orphans[0]?.n ?? 0) === 0,
    });
  } catch (err) {
    checks.push({
      name: "region_tematica orphans",
      error: String(err),
      ok: false,
    });
  }

  // Check 4: tematica slugs in especie_tematica exist in tematica table
  try {
    const missing = await queryRows(`
      SELECT et.slug_tematica, COUNT(*) AS n
      FROM especie_tematica et
      LEFT JOIN tematica t ON et.slug_tematica = t.slug
      WHERE t.slug IS NULL
      GROUP BY et.slug_tematica
      ORDER BY n DESC
      LIMIT 10
    `);
    checks.push({
      name: "tematica slugs not in tematica table",
      description: "Slug values used in especie_tematica missing from tematica",
      missing: missing.map((m) => ({
        slug: m.slug_tematica,
        count: Number(m.n),
      })),
      ok: missing.length === 0,
    });
  } catch (err) {
    checks.push({
      name: "tematica slugs not in tematica table",
      error: String(err),
      ok: false,
    });
  }

  // Check 5: regions with no especies_region_total
  try {
    const missing = await queryRows(`
      SELECT slug FROM region r
      WHERE NOT EXISTS (
        SELECT 1 FROM region_tematica rt WHERE rt.slug_region = r.slug
      )
      LIMIT 20
    `);
    checks.push({
      name: "regions without indicators",
      description: "Regions in 'region' table with no row in 'region_tematica'",
      missing: missing.map((m) => m.slug),
      count: missing.length,
      ok: missing.length === 0,
    });
  } catch (err) {
    checks.push({
      name: "regions without indicators",
      error: String(err),
      ok: false,
    });
  }

  // Helper: list non-identifying columns of a table. Drops slug/tipo/
  // fecha_corte/*_ref_id so we only compare real indicator columns.
  async function indicatorCols(table: string): Promise<string[]> {
    const rows = await queryRows(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_name = $1
       ORDER BY ordinal_position`,
      [table],
    );
    return rows
      .map((r) => String(r.column_name))
      .filter((c) => {
        if (c === "slug_region" || c === "slug_grupo") return false;
        if (c === "tipo" || c === "label_region") return false;
        if (c === "fecha_corte") return false;
        if (c.endsWith("_ref_id")) return false;
        return true;
      });
  }

  // Check: every real indicator column in region_tematica has an ind_meta row.
  try {
    const metaRows = await queryRows(`SELECT indicador FROM ind_meta`);
    const metaSet = new Set(metaRows.map((r) => String(r.indicador)));
    const cols = await indicatorCols("region_tematica");
    const missing = cols.filter((c) => !metaSet.has(c));
    checks.push({
      name: "ind_meta covers region_tematica columns",
      description:
        "Every indicator column in region_tematica should have a row in ind_meta (Google Sheet). Missing entries mean a new upstream column with no metadata.",
      count: missing.length,
      missing,
      ok: missing.length === 0,
    });
  } catch (err) {
    checks.push({
      name: "ind_meta covers region_tematica columns",
      error: String(err),
      ok: false,
    });
  }

  // Check: every real indicator column in region_grupo has an ind_meta row.
  try {
    const metaRows = await queryRows(`SELECT indicador FROM ind_meta`);
    const metaSet = new Set(metaRows.map((r) => String(r.indicador)));
    const cols = await indicatorCols("region_grupo");
    const missing = cols.filter((c) => !metaSet.has(c));
    checks.push({
      name: "ind_meta covers region_grupo columns",
      description:
        "Every indicator column in region_grupo should have a row in ind_meta. Missing entries mean a new upstream column with no metadata.",
      count: missing.length,
      missing,
      ok: missing.length === 0,
    });
  } catch (err) {
    checks.push({
      name: "ind_meta covers region_grupo columns",
      error: String(err),
      ok: false,
    });
  }

  // Check: every ind_meta.indicador maps to a real column in either
  // region_tematica or region_grupo. Orphan rows = sheet out of sync.
  try {
    const metaRows = await queryRows(`SELECT indicador FROM ind_meta`);
    const rt = new Set(await indicatorCols("region_tematica"));
    const rg = new Set(await indicatorCols("region_grupo"));
    const orphans: string[] = [];
    for (const r of metaRows) {
      const ind = String(r.indicador);
      if (!rt.has(ind) && !rg.has(ind)) orphans.push(ind);
    }
    checks.push({
      name: "ind_meta rows map to real columns",
      description:
        "Every row in ind_meta should match a column in region_tematica or region_grupo. Orphans are metadata for indicators that don't exist in the ingested data.",
      count: orphans.length,
      missing: orphans,
      ok: orphans.length === 0,
    });
  } catch (err) {
    checks.push({
      name: "ind_meta rows map to real columns",
      error: String(err),
      ok: false,
    });
  }

  // Check: tematica tree has no orphan active children. A row with
  // activa=TRUE whose parent row has activa=FALSE disappears from
  // /api/tematicas/tree because the parent chain breaks. The tree
  // endpoint's behavior is correct for consistent data; this check
  // surfaces the inconsistency so the Google Sheet can be fixed.
  try {
    const rows = await queryRows(
      `SELECT slug, parent, activa FROM tematica`,
    );
    const byslug = new Map(
      rows.map((r) => [String(r.slug), {
        slug: String(r.slug),
        parent: r.parent == null ? null : String(r.parent),
        activa: Boolean(r.activa),
      }]),
    );
    const orphans: string[] = [];
    for (const row of byslug.values()) {
      if (!row.activa || row.parent == null) continue;
      const parent = byslug.get(row.parent);
      if (!parent || !parent.activa) {
        orphans.push(
          `${row.slug} (parent=${row.parent}, ${parent == null ? "missing" : "inactive"})`,
        );
      }
    }
    checks.push({
      name: "tematica tree — active children under inactive parents",
      description:
        "Children flagged activa=TRUE whose parent row is activa=FALSE or missing. These rows won't appear in /api/tematicas/tree because the path from the tree root breaks.",
      count: orphans.length,
      missing: orphans,
      ok: orphans.length === 0,
    });
  } catch (err) {
    checks.push({
      name: "tematica tree — active children under inactive parents",
      error: String(err),
      ok: false,
    });
  }

  // Structural checks (presence / required columns / PK / row floors / value sanity)
  checks.push(...(await runStructuralChecks(queryRows)));

  return checks;
}

/** Render a validation report as a markdown summary (validate:data report). */
export function formatDataReport(checks: DataCheck[]): string {
  const fails = checks.filter((c) => !c.ok && c.level === "fail");
  const warns = checks.filter((c) => !c.ok && c.level !== "fail");
  const passed = checks.filter((c) => c.ok);
  const lines: string[] = [];
  lines.push("# Data validation report");
  lines.push("");
  lines.push(
    `**${passed.length} passed · ${warns.length} warnings · ${fails.length} failures** ` +
      `(of ${checks.length} checks) — _${new Date().toISOString()}_`,
  );
  lines.push("");
  for (const c of checks) {
    const mark = c.ok ? "✓" : c.level === "fail" ? "✗ FAIL" : "⚠ warn";
    let detail = "";
    if (typeof c.count === "number" && !c.ok) detail = ` — ${c.count}`;
    if (c.error) detail = ` — error: ${c.error}`;
    lines.push(`- ${mark} **${c.name}**${detail}`);
    // Show the item list for failing checks AND for ok=true "(info)" checks
    // that carry data (e.g. the subtipo inventory) — so stats live here.
    if (Array.isArray(c.missing) && c.missing.length > 0) {
      const limit = c.ok ? 40 : 8;
      const sample = c.missing
        .slice(0, limit)
        .map((m) => (typeof m === "string" ? m : JSON.stringify(m)));
      lines.push(
        `    ${sample.join("; ")}${c.missing.length > limit ? " …" : ""}`,
      );
    }
  }
  return lines.join("\n");
}
