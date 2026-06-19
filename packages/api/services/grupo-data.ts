import { queryRows } from "../db.ts";
import { listSpecies, batchSpeciesByTematica } from "./species-list.ts";
import { getParentRegion } from "./region-general.ts";

// The `estimada` table stores *_estimadas columns as VARCHAR (DuckDB
// inferred them from the TSV, which mixes numeric values with blanks
// and "NA"). Shape contracts expect numbers, so coerce on the way out:
// valid numeric strings → Number, anything else → null.
function toNumOrNull(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "number") return v;
  const s = String(v).trim();
  if (s === "" || s === "NA") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/**
 * Run an async mapper over `items` with at most `limit` calls in flight
 * at a time. Preserves input order in the output array.
 *
 * Why bounded: DuckDB allocates working memory per concurrent query,
 * and the Deno Deploy isolate caps at ~586 MiB. An unbounded
 * Promise.all over ~40 grupos × 3 inner queries = 120 parallel
 * connections OOM'd the prod isolate after the parallelize fix in
 * upstream #5. 8-wide gives most of the speedup without the OOM tail.
 */
async function mapWithLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (true) {
      const idx = next++;
      if (idx >= items.length) return;
      results[idx] = await fn(items[idx]);
    }
  }
  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    () => worker(),
  );
  await Promise.all(workers);
  return results;
}

// Why 1 (sequential): the route already fires two getRegionGrupoData
// calls in parallel (biologico + interes via Promise.all in
// region-detail.ts) and Deno Deploy serves multiple concurrent users
// per isolate. With a 4-wide internal fan-out we hit DuckDB OOM under
// load (381 MiB cap saturates). Sequential per-call keeps total
// in-flight queries bounded enough that the isolate stays healthy
// while still finishing in ~1-2s vs the original 4-13s tail.
const GRUPO_CONCURRENCY = 1;

/**
 * Comparison reference used by the special-region bullseye chart.
 * `ref_kind` is "grupo" when comparing against the immediate parent group
 * in the same region (e.g. mariposas vs insectos in Amazonía), or "region"
 * when comparing against the region's total observed species.
 */
export interface GrupoComparison {
  ref_kind: "grupo" | "region";
  ref_label: string;
  ref_especies: number;
  region_label: string;
  percentage: number | null;
}

// Subtipos that count as "special regions" (Resguardo, Reserva, Región
// Amazonía, NDFyB). For these the bullseye compares against the parent group
// in the SAME region instead of the same group at national level.
// See client spec 2026-06 (Anexo Técnico UX/UI).
const SPECIAL_REGION_SUBTIPOS = new Set([
  "Regiones naturales",
  "Territorios indígenas",
  "Reservas forestales protectoras",
  "NDFyB",
]);

/**
 * Port of region_grupo_data() from the legacy reference
 */
export async function getRegionGrupoData(
  region: string,
  tipo: "biologico" | "interes"
): Promise<Record<string, unknown>[]> {
  const parent = await getParentRegion(region);

  // All groups for this region + tipo
  const groups = await queryRows(`
    SELECT * FROM region_grupo
    WHERE slug_region = $1 AND tipo = $2
  `, [region, tipo]);

  // Special-region hierarchical comparison setup. Only fetched when the
  // region is a Resguardo / Reserva / Región Amazonía / NDFyB; normal
  // departments and municipalities keep the same-group-vs-Colombia bullseye.
  const regionRows = await queryRows(
    `SELECT subtipo, label FROM region WHERE slug = $1`,
    [region],
  );
  const regionLabel = (regionRows[0]?.label as string) ?? region;
  const isSpecialRegion = SPECIAL_REGION_SUBTIPOS.has(
    regionRows[0]?.subtipo as string,
  );

  let regionTotalEspecies = 0;
  let grupoHierarchy = new Map<string, { parent: string; label: string }>();
  let regionGroupCount = new Map<string, number>();
  if (isSpecialRegion) {
    const tematicaRows = await queryRows(
      `SELECT especies_region_total FROM region_tematica WHERE slug_region = $1`,
      [region],
    );
    regionTotalEspecies =
      toNumOrNull(tematicaRows[0]?.especies_region_total) ?? 0;

    const grupoMeta = await queryRows(`SELECT slug, parent, label FROM grupo`);
    grupoHierarchy = new Map(
      grupoMeta.map((g) => [
        g.slug as string,
        { parent: g.parent as string, label: g.label as string },
      ]),
    );
    regionGroupCount = new Map(
      groups.map((g) => [
        g.slug_grupo as string,
        toNumOrNull(g.especies_region_total) ?? 0,
      ]),
    );
  }

  // Parent groups for comparison
  const parentGroups = await queryRows(`
    SELECT rg.slug_grupo AS slug, r.label,
      rg.especies_region_total, rg.registros_region_total
    FROM region_grupo rg
    LEFT JOIN region r ON rg.slug_region = r.slug
    WHERE rg.slug_region = $1 AND rg.tipo = $2
  `, [parent, tipo]);

  const parentMap = new Map(
    parentGroups.map((g) => [g.slug as string, g])
  );

  // Estimadas by grupo
  const estimadasAll = await queryRows(`SELECT * FROM estimada`);
  const estimadasMap = new Map(
    estimadasAll.map((e) => [e.slug_grupo as string, e])
  );

  const tematicaSlugs = [
    "amenazadas-nacional", "amenazadas-global", "cites",
    "migratorias", "endemicas", "exoticas-total",
  ];

  // Per-grupo work runs concurrently with a hard cap (GRUPO_CONCURRENCY)
  // so we don't pin too many DuckDB connections at once — unbounded
  // Promise.all over 40 grupos × 3 inner queries OOM'd the Deno
  // Deploy isolate. 8-wide keeps most of the speedup vs the original
  // sequential loop without exhausting memory.
  return mapWithLimit(groups, GRUPO_CONCURRENCY, async (group) => {
    const grupoSlug = group.slug_grupo as string;
    const est = estimadasMap.get(grupoSlug) ?? {};

    const [subgrupos, speciesTop, speciesByTematica] = await Promise.all([
      queryRows(
        `SELECT rg.slug_grupo, g.label AS label_grupo, rg.especies_region_total
         FROM region_grupo rg
         LEFT JOIN grupo g ON rg.slug_grupo = g.slug
         WHERE rg.slug_region = $1
           AND rg.slug_grupo IN (SELECT slug FROM grupo WHERE parent = $2)`,
        [region, grupoSlug],
      ),
      listSpecies(region, { grupo: grupoSlug }),
      batchSpeciesByTematica(region, tematicaSlugs, { grupo: grupoSlug }),
    ]);

    // parent must be an ARRAY (matches static contract).
    const parentEntry = parentMap.get(grupoSlug);
    const parentArr = parentEntry ? [parentEntry] : [];

    // Special-region bullseye reference: parent group in the same region for
    // nested biológico groups, else the region's total observed species.
    let comparison: GrupoComparison | null = null;
    if (isSpecialRegion) {
      const inner = toNumOrNull(group.especies_region_total) ?? 0;
      const parentGrupoSlug = grupoHierarchy.get(grupoSlug)?.parent;
      const usesParentGroup =
        tipo === "biologico" &&
        parentGrupoSlug != null &&
        parentGrupoSlug !== "0" &&
        regionGroupCount.has(parentGrupoSlug);

      if (usesParentGroup) {
        const refEspecies = regionGroupCount.get(parentGrupoSlug!) ?? 0;
        const refLabel =
          grupoHierarchy.get(parentGrupoSlug!)?.label ?? parentGrupoSlug!;
        comparison = {
          ref_kind: "grupo",
          ref_label: refLabel.toLowerCase(),
          ref_especies: refEspecies,
          region_label: regionLabel,
          percentage: refEspecies > 0 ? (inner / refEspecies) * 100 : null,
        };
      } else {
        comparison = {
          ref_kind: "region",
          ref_label: "especies observadas",
          ref_especies: regionTotalEspecies,
          region_label: regionLabel,
          percentage:
            regionTotalEspecies > 0 ? (inner / regionTotalEspecies) * 100 : null,
        };
      }
    }

    return {
      slug: grupoSlug,
      ...group,
      parent: parentArr,
      // Only special regions carry `comparison`; normal departments and
      // municipalities omit the key entirely so their shape stays identical
      // to the R contract (region-shape.test.ts).
      ...(isSpecialRegion ? { comparison } : {}),
      estimadas: {
        especies_amenazadas_nacional_total_estimadas: toNumOrNull(
          est.especies_amenazadas_nacional_total_estimadas,
        ),
        especies_amenazadas_global_total_estimadas: toNumOrNull(
          est.especies_amenazadas_global_total_estimadas,
        ),
        especies_cites_total_estimadas: toNumOrNull(
          est.especies_cites_total_estimadas,
        ),
        especies_endemicas_estimadas: toNumOrNull(
          est.especies_endemicas_estimadas,
        ),
      },
      subgrupo_especies: subgrupos,
      species_list_top: speciesTop,
      species_list_tematica: speciesByTematica,
    };
  });
}
