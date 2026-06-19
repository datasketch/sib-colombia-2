import { join } from "https://deno.land/std@0.224.0/path/mod.ts";
import type { DuckDBConnection } from "@duckdb/node-api";
import { getRowCount } from "./ingest.ts";

/**
 * Complementary CSV file definitions.
 * These are NOT from GitLab — they come from Google Sheets and are stored locally.
 */
const CSV_FILES = [
  { tableName: "ind_meta", fileName: "ind_meta.csv", delimiter: "," },
  { tableName: "gallery_images", fileName: "gallery_images.csv", delimiter: "," },
  { tableName: "banner_images", fileName: "banner_images.csv", delimiter: "," },
  { tableName: "preg_frecuentes", fileName: "preg_frecuentes.csv", delimiter: "," },
  { tableName: "glosario", fileName: "glosario.csv", delimiter: "," },
  { tableName: "referencias_home", fileName: "referencias_home.csv", delimiter: "," },
];

/**
 * Load all complementary data files.
 * Port of DATASET.R lines 41-74.
 */
export async function loadComplementaryData(
  conn: DuckDBConnection,
  complementaryDir: string
): Promise<void> {
  console.log("\nLoading complementary data...");

  // `tematica` is NOT overwritten here. It comes straight from the GitLab
  // source (ingested in step 2 of mod.ts); its editorial `orden` is patched
  // afterwards in tematica-order.ts. A hand-maintained tematica.tsv used to
  // clobber it here — removed so the build is reproducible from upstream
  // alone (any correction, e.g. the `activa` flags for the CITES/exóticas
  // sub-categories, lives in the GitLab tematica.tsv, not in this repo).

  // 1. Create territorio as copy of region (DATASET.R line 45)
  await conn.run(`CREATE OR REPLACE TABLE territorio AS SELECT * FROM region`);
  const territorioCount = await getRowCount(conn, "territorio");
  console.log(`  territorio (copy of region): ${territorioCount} rows`);

  // 2. Load CSV files
  for (const { tableName, fileName, delimiter } of CSV_FILES) {
    const filePath = join(complementaryDir, fileName);
    await conn.run(
      `CREATE OR REPLACE TABLE "${tableName}" AS SELECT * FROM read_csv_auto('${filePath}', delim='${delimiter}', header=true)`
    );
    const count = await getRowCount(conn, tableName);
    console.log(`  ${tableName}: ${count} rows`);
  }
}
