import type { DuckDBConnection } from "@duckdb/node-api";

/**
 * Patch tematica `orden` so the explorer renders rows in the editorial
 * order from the legacy Shiny app, not alphabetical or upstream-default.
 *
 * Why this lives here: `tematica` is owned by the upstream GitLab source
 * and re-ingested on every refresh, so we can't durably correct the values
 * at source from this repo. The seed pipeline applies the canonical order
 * in DuckDB after ingest. Downstream API consumers see the correct `orden`
 * directly from the database — no per-route override. The right long-term
 * fix is upstream (in the GitLab tematica.tsv); delete these patches once
 * the data team lands it.
 *
 * Two patches today:
 *
 *   1. Top-level roots: ship with NULL `orden`. Filled in 1..5 only
 *      when NULL — idempotent, becomes a no-op the day upstream fills
 *      the values.
 *
 *   2. CITES children: ship in reverse order (III=1 → I=4). Forced to
 *      ascending logical order I=1, I-II=2, II=3, III=4. Always
 *      overwrites the upstream values because they're known-wrong;
 *      the BACKLOG entry tracks the upstream ask, and once the data
 *      team flips the sheet the patch should be deleted.
 */
const ROOT_ORDER: Array<[string, number]> = [
  ["amenazadas", 1],
  ["cites", 2],
  ["endemicas", 3],
  ["migratorias", 4],
  ["exoticas-total", 5],
];

const CITES_CHILD_ORDER: Array<[string, number]> = [
  ["cites-i", 1],
  ["cites-i-ii", 2],
  ["cites-ii", 3],
  ["cites-iii", 4],
];

function applySlugOrder(
  pairs: Array<[string, number]>,
  options: { onlyWhenNull: boolean },
): { sql: string; slugList: string } {
  const cases = pairs
    .map(([slug, ord]) => `WHEN '${slug}' THEN ${ord}`)
    .join(" ");
  const slugList = pairs.map(([slug]) => `'${slug}'`).join(", ");
  const guard = options.onlyWhenNull ? " AND orden IS NULL" : "";
  return {
    sql: `UPDATE tematica
          SET orden = CASE slug ${cases} END
          WHERE slug IN (${slugList})${guard}`,
    slugList,
  };
}

export async function applyTematicaRootOrder(
  conn: DuckDBConnection,
): Promise<void> {
  console.log("\nApplying tematica order patches…");

  // Roots: fill only when NULL.
  const roots = applySlugOrder(ROOT_ORDER, { onlyWhenNull: true });
  await conn.run(roots.sql);

  // CITES children: overwrite upstream's reversed values.
  const cites = applySlugOrder(CITES_CHILD_ORDER, { onlyWhenNull: false });
  await conn.run(cites.sql);

  const allSlugs = `${roots.slugList}, ${cites.slugList}`;
  const result = await conn.runAndReadAll(
    `SELECT slug, orden FROM tematica
     WHERE slug IN (${allSlugs})
     ORDER BY parent NULLS FIRST, orden`,
  );
  for (const row of result.getRows()) {
    console.log(`  ${row[0]}: orden=${row[1]}`);
  }
}
