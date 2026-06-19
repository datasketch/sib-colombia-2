import type { DuckDBConnection } from "@duckdb/node-api";

const INDEXES = [
  `CREATE INDEX IF NOT EXISTS idx_especie_region_slug ON especie_region(slug_region)`,
  `CREATE INDEX IF NOT EXISTS idx_especie_tematica_slug ON especie_tematica(slug_region, slug_tematica)`,
  `CREATE INDEX IF NOT EXISTS idx_especie_grupo_slug ON especie_grupo(slug_grupo)`,
  `CREATE INDEX IF NOT EXISTS idx_region_tematica_slug ON region_tematica(slug_region)`,
  `CREATE INDEX IF NOT EXISTS idx_region_grupo_slug ON region_grupo(slug_region, tipo)`,
  `CREATE INDEX IF NOT EXISTS idx_region_publicador_slug ON region_publicador(slug_region)`,
];

/**
 * Create indexes on large tables for API query performance.
 */
export async function createIndexes(conn: DuckDBConnection): Promise<void> {
  console.log("\nCreating indexes...");

  for (const sql of INDEXES) {
    await conn.run(sql);
    const match = sql.match(/idx_\w+/);
    if (match) console.log(`  ${match[0]}`);
  }
}
