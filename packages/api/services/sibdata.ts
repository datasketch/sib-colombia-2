import { getIndicatorMeta, selectIndicators } from "./ind_meta.ts";
import { regionExists } from "./region-general.ts";
import { getGrupoSlugs } from "./grupos.ts";
import {
  queryRegionTematica,
  queryRegionGrupo,
  querySubregionTematica,
  querySubregionGrupo,
  queryWithParentTematica,
} from "./sibdata-queries.ts";

/**
 * Unified biodiversity query function. Port of `the reference sibdata()`.
 * One entry point for every consumer (region profile route, explorer,
 * ad-hoc CSV exports). See `PLAN_PHASE_7.1.md` for design + endpoint
 * spec.
 */

export interface SibdataParams {
  region: string;
  tipo?: string;
  cobertura?: string;
  tematica?: string;
  indicador?: string;
  grupo?: string;
  subregiones?: boolean;
  with_parent?: boolean;
  tidy?: boolean;
  n_especies?: boolean;
  all_indicators?: boolean;
}

/** Columns to keep through projection regardless of indicator selection. */
function isIdCol(k: string): boolean {
  return (
    k.includes("slug") ||
    k.includes("label") ||
    k.includes("grupo") ||
    k === "cod_dane" ||
    k === "fecha_corte"
  );
}

/**
 * API_REQUIREMENTS §1.1: when `slug_grupo` is present, expose it as
 * `grupo` in the output. Keep `slug_grupo` out of the response so
 * clients have a single field to read.
 */
function aliasGrupo(row: Record<string, unknown>): Record<string, unknown> {
  if (!("slug_grupo" in row)) return row;
  const { slug_grupo, ...rest } = row;
  return { ...rest, grupo: slug_grupo };
}

/**
 * 5-branch dispatcher. Mirrors `the reference sibdata_wide()` routing:
 *   subregiones && grupo  → query_subregion_grupo
 *   subregiones           → query_subregion_tematica
 *   with_parent           → query_with_parent_tematica
 *   grupo (no subregs)    → query_region_grupo
 *   default               → query_region_tematica
 * Then projects the wide DataFrame down to identifying columns +
 * selected indicator columns.
 */
export async function sibdataWide(
  params: SibdataParams,
): Promise<Record<string, unknown>[]> {
  if (!params.region) throw new Error("region is required");

  let rows: Record<string, unknown>[];
  if (params.subregiones) {
    rows = params.grupo
      ? await querySubregionGrupo(params.region, params.grupo)
      : await querySubregionTematica(params.region);
  } else if (params.with_parent) {
    rows = await queryWithParentTematica(params.region);
  } else if (params.grupo) {
    rows = await queryRegionGrupo(params.region, params.grupo);
  } else {
    rows = await queryRegionTematica(params.region);
  }

  if (rows.length === 0) return [];

  let selInds: string[];
  if (params.indicador) {
    selInds = [params.indicador];
  } else {
    selInds = await selectIndicators({
      tipo: params.tipo,
      cobertura: params.cobertura,
      tematica: params.tematica,
    });
    if (selInds.length === 0) {
      throw new Error(
        `No indicator matches tipo=${params.tipo}, cobertura=${params.cobertura}, tematica=${params.tematica}`,
      );
    }
  }

  const selSet = new Set(selInds);
  const projected = rows.map((row) => {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(row)) {
      if (isIdCol(k) || selSet.has(k)) out[k] = row[k];
    }
    return out;
  });

  // `distinct()` equivalent: drop exact duplicates.
  const seen = new Set<string>();
  const unique: Record<string, unknown>[] = [];
  for (const row of projected) {
    const key = JSON.stringify(row);
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(row);
    }
  }
  return unique.map(aliasGrupo);
}

/**
 * Pivot wide → long (`indicador` + `count` columns) and apply
 * tematica/cobertura filter rules. Mirrors `the reference sibdata_tidify()`.
 */
export async function sibdataTidify(
  wide: Record<string, unknown>[],
  opts: {
    tematica?: string;
    cobertura?: string;
    all_indicators?: boolean;
  },
): Promise<Record<string, unknown>[]> {
  const inds = await getIndicatorMeta();
  const notTematica = new Set(
    inds.filter((i) => i.tematica == null).map((i) => i.indicador),
  );
  const notCobertura = new Set(
    inds.filter((i) => i.cobertura === "total").map((i) => i.indicador),
  );
  const isCatTematica = new Set(
    inds
      .filter(
        (i) =>
          i.categorias_tematicas != null && i.categorias_tematicas !== "total",
      )
      .map((i) => i.indicador),
  );

  // Pivot
  const pivoted: Record<string, unknown>[] = [];
  for (const row of wide) {
    const idCols: Record<string, unknown> = {};
    const valueCols: [string, unknown][] = [];
    for (const [k, v] of Object.entries(row)) {
      if (isIdCol(k)) idCols[k] = v;
      else valueCols.push([k, v]);
    }
    for (const [indicador, count] of valueCols) {
      pivoted.push({ ...idCols, indicador, count });
    }
  }

  if (opts.all_indicators) return pivoted;
  if (pivoted.length === 0) return pivoted;

  // Drop char columns with only one unique non-null value (mirrors
  // select_non_single_cat_cols). Keep `indicador` and `count`.
  const colsToDrop = new Set<string>();
  const cols = Object.keys(pivoted[0]);
  for (const k of cols) {
    if (k === "indicador" || k === "count") continue;
    const vals = new Set<unknown>();
    for (const row of pivoted) vals.add(row[k]);
    if (vals.size !== 1) continue;
    const v = [...vals][0];
    if (typeof v === "number") continue;
    if (v == null) continue;
    colsToDrop.add(k);
  }

  let out = pivoted.map((row) => {
    if (colsToDrop.size === 0) return row;
    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(row)) {
      if (!colsToDrop.has(k)) cleaned[k] = v;
    }
    return cleaned;
  });

  // tematica filter
  if (opts.tematica == null) {
    out = out.filter((r) => notTematica.has(String(r.indicador)));
  } else {
    out = out.filter((r) => String(r.indicador).includes(opts.tematica!));
    if (/amenazada|cites/.test(opts.tematica)) {
      out = out.filter((r) => isCatTematica.has(String(r.indicador)));
      out = out.filter((r) => /_en|_cr|_vu|_i/.test(String(r.indicador)));
    }
  }

  // cobertura filter
  if (opts.cobertura == null) {
    out = out.filter((r) => notCobertura.has(String(r.indicador)));
  }

  return out;
}

/**
 * Validate inputs against the database so the endpoint rejects bogus
 * values with a 400 instead of silently returning empty. Mirrors
 * `the reference check_cases_values()`.
 */
export async function validateSibdataParams(
  params: SibdataParams,
): Promise<string[]> {
  const errors: string[] = [];
  const inds = await getIndicatorMeta();

  if (params.tipo) {
    const tipos = new Set(inds.map((i) => i.tipo).filter(Boolean));
    if (!tipos.has(params.tipo)) {
      errors.push(`tipo must be one of: ${[...tipos].join(", ")}`);
    }
  }
  if (params.cobertura) {
    const covs = new Set(inds.map((i) => i.cobertura).filter(Boolean));
    if (!covs.has(params.cobertura)) {
      errors.push(`cobertura must be one of: ${[...covs].join(", ")}`);
    }
  }
  if (params.tematica) {
    const ts = new Set<string>();
    for (const i of inds) {
      if (i.tematica) ts.add(i.tematica);
      if (i.subtematica) ts.add(i.subtematica);
      if (i.categorias_tematicas) ts.add(i.categorias_tematicas);
    }
    if (!ts.has(params.tematica)) {
      errors.push(`tematica not recognized: ${params.tematica}`);
    }
  }
  if (params.indicador) {
    const knownInds = new Set(inds.map((i) => i.indicador));
    if (!knownInds.has(params.indicador)) {
      errors.push(`indicador not recognized: ${params.indicador}`);
    }
  }
  if (params.grupo) {
    const grupoSlugs = await getGrupoSlugs();
    if (!grupoSlugs.has(params.grupo)) {
      errors.push(`grupo not found: ${params.grupo}`);
    }
  }
  if (params.subregiones && params.with_parent) {
    errors.push("subregiones and with_parent are mutually exclusive");
  }

  return errors;
}

/**
 * Public entry point. Mirrors `the reference sibdata()`.
 */
export async function sibdata(
  params: SibdataParams,
): Promise<Record<string, unknown>[] | { count: number }> {
  const errors = await validateSibdataParams(params);
  if (errors.length > 0) throw new ValidationError(errors.join("; "));

  if (!(await regionExists(params.region))) {
    throw new NotFoundError(`region not found: ${params.region}`);
  }

  const tidy = params.tidy !== false; // default true
  const wide = await sibdataWide(params);

  let result: Record<string, unknown>[];
  if (tidy) {
    // Tidy long is the default shape — every row has `indicador` +
    // `count`. When a specific `indicador=` was requested, sibdataWide
    // already projected to just that column, so we skip the
    // tematica/cobertura filter rules (otherwise they'd drop the row
    // when it doesn't match the current tematica scope). This matches
    // API_REQUIREMENTS.md §1.1 — clients get the same shape whether
    // they asked for one indicator or many.
    result = await sibdataTidify(wide, {
      tematica: params.tematica,
      cobertura: params.cobertura,
      all_indicators: params.all_indicators || !!params.indicador,
    });
  } else {
    result = wide;
  }

  if (params.n_especies) {
    const row = result.find(
      (r) => r.indicador === "especies_region_total",
    );
    const count = row?.count;
    return { count: count == null ? 0 : Number(count) };
  }

  return result;
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}
