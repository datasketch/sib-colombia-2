import { queryRows, queryOne } from "../db.ts";

/**
 * Low-level dispatchers for the 5 query shapes that `sibdata()` routes
 * to. Each takes parameterized inputs (no string interpolation) and
 * returns raw DuckDB rows enriched with:
 *
 *   - `label_region`  — region's display label.
 *   - `label`         — mirror of `label_region`, kept for the explorer
 *                       (API_REQUIREMENTS.md §1.1 response shape).
 *   - `cod_dane`      — DANE code from `departamento` or `municipio`
 *                       (null for country/specials). Required for the
 *                       map view's GeoJSON join.
 *
 * Mirrors `the reference implementation`.
 */

/** `the reference sib_parent_region()` — parent with R's special cases. */
export async function sibParentRegion(region: string): Promise<string> {
  const reservaResguardo = new Set([
    "reserva-forestal-la-planada",
    "resguardo-indigena-pialapi-pueblo-viejo",
  ]);
  if (reservaResguardo.has(region)) return "narino";
  if (region === "region-amazonia") return "colombia";

  const row = await queryOne(
    `SELECT parent FROM region WHERE slug = $1`,
    [region],
  );
  const parent = (row?.parent as string | null) ?? null;
  if (parent === "regiones-naturales" || parent == null) return "colombia";
  return parent;
}

/**
 * `the reference sib_available_subregions()` — children of a region, with
 * colombia/bogota-dc special cases from `queries.R`.
 */
async function sibAvailableSubregions(region: string): Promise<string[]> {
  if (region === "bogota-dc") return ["bogota-dc"];
  const rows = await queryRows(
    `SELECT slug FROM region WHERE parent = $1`,
    [region],
  );
  const slugs = rows.map((r) => String(r.slug));
  if (region === "colombia" && !slugs.includes("bogota-dc")) {
    slugs.push("bogota-dc");
  }
  return slugs;
}

const LABEL_COD_JOIN = `
  LEFT JOIN region r       ON rt.slug_region = r.slug
  LEFT JOIN departamento d ON rt.slug_region = d.slug
  LEFT JOIN municipio m    ON rt.slug_region = m.slug`;
const LABEL_COD_JOIN_RG = LABEL_COD_JOIN.replace(/rt\./g, "rg.");
const LABEL_COD_SELECT = `r.label AS label_region,
         r.label AS label,
         COALESCE(d.cod_dane, m.cod_dane) AS cod_dane`;

/** 1/5 — `query_region_tematica`. */
export async function queryRegionTematica(
  region: string,
): Promise<Record<string, unknown>[]> {
  return await queryRows(
    `SELECT rt.*, ${LABEL_COD_SELECT}
     FROM region_tematica rt ${LABEL_COD_JOIN}
     WHERE rt.slug_region = $1`,
    [region],
  );
}

/** 2/5 — `query_region_grupo`. */
export async function queryRegionGrupo(
  region: string,
  grupo: string,
): Promise<Record<string, unknown>[]> {
  return await queryRows(
    `SELECT rg.*, ${LABEL_COD_SELECT}
     FROM region_grupo rg ${LABEL_COD_JOIN_RG}
     WHERE rg.slug_region = $1 AND rg.slug_grupo = $2`,
    [region, grupo],
  );
}

/** 3/5 — `query_subregion_tematica`. */
export async function querySubregionTematica(
  region: string,
): Promise<Record<string, unknown>[]> {
  const subregs = await sibAvailableSubregions(region);
  if (subregs.length === 0) return [];
  const placeholders = subregs.map((_, i) => `$${i + 1}`).join(", ");
  const rows = await queryRows(
    `SELECT rt.*, ${LABEL_COD_SELECT}
     FROM region_tematica rt ${LABEL_COD_JOIN}
     WHERE rt.slug_region IN (${placeholders})`,
    subregs,
  );
  // R drops fecha_corte and applies distinct() after the join.
  const seen = new Set<string>();
  const out: Record<string, unknown>[] = [];
  for (const row of rows) {
    const { fecha_corte: _fc, ...rest } = row as Record<string, unknown>;
    const key = JSON.stringify(rest);
    if (!seen.has(key)) {
      seen.add(key);
      out.push(rest);
    }
  }
  return out;
}

/** 4/5 — `query_subregion_grupo`. */
export async function querySubregionGrupo(
  region: string,
  grupo: string,
): Promise<Record<string, unknown>[]> {
  const subregs = await sibAvailableSubregions(region);
  if (subregs.length === 0) return [];
  const placeholders = subregs.map((_, i) => `$${i + 2}`).join(", ");
  return await queryRows(
    `SELECT rg.*, ${LABEL_COD_SELECT}
     FROM region_grupo rg ${LABEL_COD_JOIN_RG}
     WHERE rg.slug_grupo = $1 AND rg.slug_region IN (${placeholders})`,
    [grupo, ...subregs],
  );
}

/** 5/5 — `query_with_parent_tematica`. */
export async function queryWithParentTematica(
  region: string,
): Promise<Record<string, unknown>[]> {
  const parent = await sibParentRegion(region);
  return await queryRows(
    `SELECT rt.*, ${LABEL_COD_SELECT}
     FROM region_tematica rt ${LABEL_COD_JOIN}
     WHERE rt.slug_region IN ($1, $2)`,
    [region, parent],
  );
}
