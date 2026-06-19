import type { DuckDBConnection } from "@duckdb/node-api";

const META_TABLE = "_sibdata_meta";

export async function ensureMetaTable(conn: DuckDBConnection): Promise<void> {
  await conn.run(`
    CREATE TABLE IF NOT EXISTS ${META_TABLE} (
      key VARCHAR PRIMARY KEY,
      value VARCHAR,
      updated_at TIMESTAMP
    )
  `);
}

export async function writeMeta(
  conn: DuckDBConnection,
  entries: Record<string, string | null | undefined>,
): Promise<void> {
  await ensureMetaTable(conn);
  const now = new Date().toISOString().replace("T", " ").replace("Z", "");
  for (const [key, value] of Object.entries(entries)) {
    if (value === undefined) continue;
    // DuckDB doesn't support parameterised upsert with named columns the same
    // way Postgres does, so do a DELETE + INSERT.
    await conn.run(`DELETE FROM ${META_TABLE} WHERE key = $1`, [key]);
    await conn.run(
      `INSERT INTO ${META_TABLE} (key, value, updated_at) VALUES ($1, $2, $3)`,
      [key, value ?? null, now],
    );
  }
}
