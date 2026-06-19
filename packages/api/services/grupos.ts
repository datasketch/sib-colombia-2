import { queryRows } from "../db.ts";

/**
 * Cached `grupo.slug` Set used by `validateSibdataParams` to check
 * whether a `?grupo=` value exists without hitting DuckDB per request.
 */
let cache: Set<string> | null = null;

export async function getGrupoSlugs(): Promise<Set<string>> {
  if (cache) return cache;
  const rows = await queryRows(`SELECT slug FROM grupo`);
  cache = new Set(rows.map((r) => String(r.slug)));
  return cache;
}

export function invalidateGrupoSlugsCache(): void {
  cache = null;
}
