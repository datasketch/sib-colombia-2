import { join } from "https://deno.land/std@0.224.0/path/mod.ts";
import type { DuckDBConnection } from "@duckdb/node-api";

/**
 * List all TSV files in a directory and derive table names.
 */
export async function listTsvFiles(
  dir: string
): Promise<{ tableName: string; filePath: string }[]> {
  const files: { tableName: string; filePath: string }[] = [];

  for await (const entry of Deno.readDir(dir)) {
    if (entry.isFile && entry.name.endsWith(".tsv")) {
      const tableName = entry.name.replace(".tsv", "");
      files.push({ tableName, filePath: join(dir, entry.name) });
    }
  }

  return files.sort((a, b) => a.tableName.localeCompare(b.tableName));
}

/**
 * Create a DuckDB table from a TSV file using read_csv_auto.
 */
export async function createTableFromTsv(
  conn: DuckDBConnection,
  tableName: string,
  filePath: string
): Promise<void> {
  await conn.run(
    `CREATE OR REPLACE TABLE "${tableName}" AS SELECT * FROM read_csv_auto('${filePath}', delim='\\t', header=true, all_varchar=false)`
  );
}

/**
 * Get row count for a table.
 */
export async function getRowCount(
  conn: DuckDBConnection,
  tableName: string
): Promise<number> {
  const result = await conn.runAndReadAll(
    `SELECT COUNT(*) as cnt FROM "${tableName}"`
  );
  const rows = result.getRows();
  return Number(rows[0][0]);
}

/**
 * Ingest all TSV files from a directory into DuckDB tables.
 */
export async function ingestTsvFiles(
  conn: DuckDBConnection,
  tsvDir: string
): Promise<Map<string, number>> {
  const files = await listTsvFiles(tsvDir);
  const counts = new Map<string, number>();

  console.log(`\nIngesting ${files.length} TSV files...`);

  for (const { tableName, filePath } of files) {
    await createTableFromTsv(conn, tableName, filePath);
    const count = await getRowCount(conn, tableName);
    counts.set(tableName, count);
    console.log(`  ${tableName}: ${count.toLocaleString()} rows`);
  }

  return counts;
}
