import type { DuckDBConnection } from "@duckdb/node-api";

/**
 * Scan the icons directory and update grupo/tematica tables with icon flags.
 * Port of DATASET.R lines 30-43.
 */
export async function updateIconFlags(
  conn: DuckDBConnection,
  iconsDir: string
): Promise<void> {
  console.log("\nUpdating icon flags...");

  // Get available icon slugs (extract prefix before first "-")
  const slugs = new Set<string>();
  for await (const entry of Deno.readDir(iconsDir)) {
    if (entry.isFile && entry.name.endsWith(".svg")) {
      const baseName = entry.name.replace(".svg", "");
      const prefix = baseName.split("-")[0];
      slugs.add(prefix);
    }
  }

  console.log(`  Found ${slugs.size} unique icon slugs`);

  const slugList = [...slugs].map((s) => `'${s}'`).join(", ");

  await conn.run(`ALTER TABLE grupo ADD COLUMN IF NOT EXISTS icon BOOLEAN DEFAULT FALSE`);
  await conn.run(`UPDATE grupo SET icon = (slug IN (${slugList}))`);

  await conn.run(`ALTER TABLE tematica ADD COLUMN IF NOT EXISTS icon BOOLEAN DEFAULT FALSE`);
  await conn.run(`UPDATE tematica SET icon = (slug IN (${slugList}))`);

  // Count how many got icons
  let result = await conn.runAndReadAll(`SELECT COUNT(*) FROM grupo WHERE icon = true`);
  console.log(`  grupo with icons: ${Number(result.getRows()[0][0])}`);

  result = await conn.runAndReadAll(`SELECT COUNT(*) FROM tematica WHERE icon = true`);
  console.log(`  tematica with icons: ${Number(result.getRows()[0][0])}`);
}
