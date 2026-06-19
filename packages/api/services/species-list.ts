import { queryRows } from "../db.ts";
import { expandTematica } from "@sibdata/shared";

/**
 * Port of list_species() from the legacy reference
 * Returns top species for a region, optionally filtered by grupo and/or tematica.
 *
 * `keepTies` controls the ranking style:
 * - true (default): RANK() OVER cutoff, matches R's slice_max(n=N) which keeps ties
 * - false: plain LIMIT N, matches R's slice(1:N)
 *
 * In the original sib R code, tematica species lists use plain top-N (slice),
 * while grupo top-species and per-grupo-tematica use slice_max-with-ties.
 */
export async function listSpecies(
  region: string,
  options: { grupo?: string; tematica?: string; limit?: number; keepTies?: boolean } = {}
): Promise<Record<string, unknown>[]> {
  const { grupo, tematica, limit = 10, keepTies = true } = options;

  let sql = `
    SELECT er.slug_especie, er.registros,
      e.species AS label, em.url_gbif, em.url_cbc
  `;

  const joins: string[] = [
    `FROM especie_region er`,
    `LEFT JOIN especie e ON er.slug_especie = e.slug`,
    `LEFT JOIN especie_meta em ON er.slug_especie = em.slug`,
  ];
  const wheres: string[] = [`er.slug_region = '${region}'`];

  if (tematica) {
    const expanded = expandTematica(tematica);
    const slugList = expanded.map((s) => `'${s}'`).join(", ");
    joins.push(
      `INNER JOIN especie_tematica et ON er.slug_region = et.slug_region AND er.slug_especie = et.slug_especie`
    );
    wheres.push(`et.slug_tematica IN (${slugList})`);
    sql += `, et.slug_tematica`;
  }

  if (grupo) {
    joins.push(
      `INNER JOIN especie_grupo eg ON er.slug_especie = eg.slug_especie`
    );
    wheres.push(`eg.slug_grupo = '${grupo}'`);
  }

  sql += `\n${joins.join("\n")}\nWHERE ${wheres.join(" AND ")}`;
  // Stable secondary sort on slug so tied registros counts produce a
  // deterministic order across runs. Without this, DuckDB returns tied
  // rows in arbitrary order — which the region-shape contracts treated
  // as flaky and caused diffs between identical re-runs of this code.
  sql += `\nORDER BY er.registros DESC, er.slug_especie ASC`;

  if (keepTies) {
    // Window function: keeps ties at the cut-off (matches R slice_max(n=N))
    const wrappedSql = `
      SELECT * FROM (
        SELECT *, RANK() OVER (ORDER BY registros DESC, slug_especie ASC) AS _rank FROM (${sql}) sub
      ) ranked
      WHERE _rank <= ${limit}
    `;
    const rows = await queryRows(wrappedSql);
    return rows.map((r) => {
      const { _rank: _, ...rest } = r;
      return rest;
    });
  }

  // Plain top-N (matches R slice(1:N))
  return await queryRows(`${sql}\nLIMIT ${limit}`);
}

/**
 * Batch fetch species lists for multiple tematica slugs at once.
 * Much more efficient than calling listSpecies() N times.
 */
export async function batchSpeciesByTematica(
  region: string,
  tematicaSlugs: string[],
  options: { grupo?: string; limit?: number } = {}
): Promise<Record<string, Record<string, unknown>[]>> {
  const { grupo, limit = 10 } = options;

  // Expand all tematica slugs
  const allExpanded: string[] = [];
  const expansionMap = new Map<string, string[]>();
  for (const slug of tematicaSlugs) {
    const expanded = expandTematica(slug);
    expansionMap.set(slug, expanded);
    allExpanded.push(...expanded);
  }

  const slugList = [...new Set(allExpanded)].map((s) => `'${s}'`).join(", ");
  if (!slugList) return {};

  let sql = `
    SELECT er.slug_especie, er.registros, et.slug_tematica,
      e.species AS label, em.url_gbif, em.url_cbc
    FROM especie_region er
    INNER JOIN especie_tematica et ON er.slug_region = et.slug_region AND er.slug_especie = et.slug_especie
    LEFT JOIN especie e ON er.slug_especie = e.slug
    LEFT JOIN especie_meta em ON er.slug_especie = em.slug
    WHERE er.slug_region = '${region}'
      AND et.slug_tematica IN (${slugList})
  `;

  if (grupo) {
    sql += `\n    AND er.slug_especie IN (SELECT slug_especie FROM especie_grupo WHERE slug_grupo = '${grupo}')`;
  }

  // Stable order: tematica, then registros desc, then slug — same
  // tiebreaker as listSpecies so the partition-and-take-top-N below
  // is deterministic across runs.
  sql += `\n    ORDER BY et.slug_tematica, er.registros DESC, er.slug_especie ASC`;

  const allRows = await queryRows(sql);

  // Partition by tematica slug and take top N per original slug
  const result: Record<string, Record<string, unknown>[]> = {};

  for (const [originalSlug, expandedSlugs] of expansionMap) {
    const expandedSet = new Set(expandedSlugs);
    const matching = allRows.filter((r) => expandedSet.has(r.slug_tematica as string));

    // Deduplicate by slug_especie keeping the highest registros
    const seen = new Map<string, Record<string, unknown>>();
    for (const row of matching) {
      const key = row.slug_especie as string;
      const existing = seen.get(key);
      if (!existing || (row.registros as number) > (existing.registros as number)) {
        seen.set(key, row);
      }
    }
    // Sort by registros DESC then keep top N + ties at the cutoff (matches R slice_max)
    const sorted = [...seen.values()].sort(
      (a, b) => (b.registros as number) - (a.registros as number),
    );
    if (sorted.length <= limit) {
      result[originalSlug] = sorted;
    } else {
      const cutoff = sorted[limit - 1].registros as number;
      // Keep everyone with registros >= cutoff
      result[originalSlug] = sorted.filter((r) => (r.registros as number) >= cutoff);
    }
  }

  return result;
}
