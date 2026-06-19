import { queryRows } from "../db.ts";

/**
 * Metadata for every indicator column exposed by `region_tematica` and
 * `region_grupo`. Loaded from the `ind_meta` table (305 rows) and
 * cached per-process. Mirrors `the reference sib_indicadores()`.
 *
 * `subtematica` is a synthetic `tematica + "_" + categorias_tematicas`
 * string used by `selectIndicators()` below; it matches
 * `the reference sib_indicadores()`'s in-R `paste(tematica, categorias_tematicas, sep="_")`.
 */
export interface IndicatorMeta {
  indicador: string;
  label: string | null;
  tipo: string | null;
  cobertura: string | null;
  slug_tematica: string | null;
  tematica: string | null;
  categorias_tematicas: string | null;
  subtematica: string | null;
  descripcion: string | null;
  orden: string | null;
}

let cache: IndicatorMeta[] | null = null;
let labelMapCache: Map<string, string | null> | null = null;

export async function getIndicatorMeta(): Promise<IndicatorMeta[]> {
  if (cache) return cache;
  const rows = await queryRows(`SELECT * FROM ind_meta`);
  cache = rows.map((r) => {
    const tematica = r.tematica == null ? null : String(r.tematica);
    const cat =
      r.categorias_tematicas == null ? null : String(r.categorias_tematicas);
    const subtematica =
      tematica != null && cat != null ? `${tematica}_${cat}` : null;
    return {
      indicador: String(r.indicador),
      label: r.label == null ? null : String(r.label),
      tipo: r.tipo == null ? null : String(r.tipo),
      cobertura: r.cobertura == null ? null : String(r.cobertura),
      slug_tematica: r.slug_tematica == null ? null : String(r.slug_tematica),
      tematica,
      categorias_tematicas: cat,
      subtematica,
      descripcion: r.descripcion == null ? null : String(r.descripcion),
      orden: r.orden == null ? null : String(r.orden),
    };
  });
  return cache;
}

export function invalidateIndMetaCache(): void {
  cache = null;
  labelMapCache = null;
}

/**
 * Cached `indicador → label` lookup. Built once from the ind_meta
 * cache and reused across requests. Used by `/api/labels`.
 */
export async function getLabelMap(): Promise<Map<string, string | null>> {
  if (labelMapCache) return labelMapCache;
  const meta = await getIndicatorMeta();
  labelMapCache = new Map(meta.map((m) => [m.indicador, m.label]));
  return labelMapCache;
}

/**
 * Pick indicator column names matching the provided filters. Mirrors
 * `the reference select_indicator()`:
 *   1. filter by `tipo` (if provided)
 *   2. filter by `cobertura` (if provided)
 *   3. for `tematica`: try exact match on `tematica`; fall back to
 *      `subtematica`; fall back to `categorias_tematicas`.
 */
export async function selectIndicators(params: {
  tipo?: string;
  cobertura?: string;
  tematica?: string;
}): Promise<string[]> {
  let inds = await getIndicatorMeta();

  if (params.tipo) {
    inds = inds.filter((i) => i.tipo === params.tipo);
  }
  if (params.cobertura) {
    inds = inds.filter((i) => i.cobertura === params.cobertura);
  }
  if (params.tematica) {
    const byTematica = inds.filter((i) => i.tematica === params.tematica);
    if (byTematica.length > 0) {
      inds = byTematica;
    } else {
      const bySub = inds.filter((i) => i.subtematica === params.tematica);
      if (bySub.length > 0) {
        inds = bySub;
      } else {
        inds = inds.filter(
          (i) => i.categorias_tematicas === params.tematica,
        );
      }
    }
  }

  return inds.map((i) => i.indicador);
}
