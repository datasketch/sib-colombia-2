import { join } from "https://deno.land/std@0.224.0/path/mod.ts";
import { ensureDir } from "https://deno.land/std@0.224.0/fs/mod.ts";
import { parse as parseCsvStd } from "https://deno.land/std@0.224.0/csv/parse.ts";
import { stringify as stringifyCsvStd } from "https://deno.land/std@0.224.0/csv/stringify.ts";

/**
 * Google Sheets IDs and sheet names — port of get_data.R.
 *
 * These are public sheets (no auth needed). We use the CSV export URL:
 * https://docs.google.com/spreadsheets/d/{ID}/export?format=csv&gid={GID}
 */

// Source spreadsheets — env-overridable so the deliverable can point at
// different (e.g. forked or relocated) public Google Sheets without editing
// code. Defaults to the current SiB Colombia sheets.
// Diccionario 2025
const DICTIONARY_SHEET_ID = Deno.env.get("SIBDATA_SHEET_DICTIONARY_ID") ??
  "1m4pO9EhVJJMZZc2MwZpYz6w8C3qLgxLPwhkd9ht51zI";

// Textos
const TEXTOS_SHEET_ID = Deno.env.get("SIBDATA_SHEET_TEXTOS_ID") ??
  "1XDWW2ZQwEId7-LqfF-PwlAB_vYDIM-bD5eqoBXvV7Rc";

interface SheetDownload {
  sheetId: string;
  sheetName: string;
  outputFile: string;
  /** Optional: select specific columns (applied after download) */
  selectColumns?: string[];
  /** Optional: filter out rows where this column is NA/empty */
  filterNotNull?: string;
}

// NOTE: TEXTOS_SHEET_ID currently has 18 tabs; we sync 6 of them. Other
// tabs (Home, Colombia, Departamento, GruposBiologicos,
// GruposBiologicos_interes, Municipio, Temáticas, Acerca de, Metodología,
// Prensa, Publicadores, Explorador, Regiones) hold editable text that is
// currently hardcoded in our pages — extend this list as content-update
// issues come in.
const SHEETS: SheetDownload[] = [
  // Dictionary sheets
  {
    sheetId: DICTIONARY_SHEET_ID,
    sheetName: "indicadores_meta",
    outputFile: "ind_meta.csv",
  },
  // Textos sheets
  {
    // `texto_destacado` is the source for the home destacados gallery
    // (see api/services/gallery.ts). Old field `descripcion` from the
    // GitLab dato_relevante.tsv was stale; this column is the live
    // SiB-edited copy.
    sheetId: TEXTOS_SHEET_ID,
    sheetName: "imagenes_galeria",
    outputFile: "gallery_images.csv",
    selectColumns: ["slug_region", "img_link", "texto_destacado", "credito"],
  },
  {
    sheetId: TEXTOS_SHEET_ID,
    sheetName: "imagenes_landings",
    outputFile: "banner_images.csv",
    selectColumns: ["slug", "credito"],
    filterNotNull: "slug",
  },
  {
    sheetId: TEXTOS_SHEET_ID,
    sheetName: "Preguntas frecuentes",
    outputFile: "preg_frecuentes.csv",
  },
  {
    sheetId: TEXTOS_SHEET_ID,
    sheetName: "Glosario",
    outputFile: "glosario.csv",
  },
  {
    sheetId: TEXTOS_SHEET_ID,
    sheetName: "Referencias-Home",
    outputFile: "referencias_home.csv",
  },
];

function buildExportUrl(sheetId: string, sheetName: string): string {
  const encoded = encodeURIComponent(sheetName);
  // headers=1 tells gviz row 1 is the header — bypasses any active sheet filters
  return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encoded}&headers=1`;
}

/**
 * Parse CSV text into headers + rows of objects. Delegates to @std/csv,
 * which handles RFC 4180 quoting, multi-line fields, and embedded commas.
 */
function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const matrix = parseCsvStd(text) as string[][];
  if (matrix.length === 0) return { headers: [], rows: [] };
  const headers = matrix[0].map((h) => h.trim());
  const rows = matrix.slice(1).map((values) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = values[i] ?? "";
    });
    return obj;
  });
  return { headers, rows };
}

/**
 * Serialize rows back to CSV text via @std/csv's stringify. Std emits
 * RFC 4180 CRLF line endings; we normalize to LF to match the rest of
 * the repo (and the older committed CSVs) so re-running the seed
 * doesn't churn the diff on every fetch.
 */
function toCsv(headers: string[], rows: Record<string, string>[]): string {
  return stringifyCsvStd(rows, { columns: headers }).replace(/\r\n/g, "\n");
}

/**
 * Fetch all Google Sheets and save as CSV files.
 * Port of data-raw/get_data.R.
 */
export async function fetchGoogleSheets(outputDir: string): Promise<void> {
  await ensureDir(outputDir);

  console.log("\nFetching Google Sheets data...");

  for (const sheet of SHEETS) {
    const url = buildExportUrl(sheet.sheetId, sheet.sheetName);
    const outPath = join(outputDir, sheet.outputFile);

    console.log(`  ${sheet.sheetName} → ${sheet.outputFile}`);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch sheet "${sheet.sheetName}": ${response.status} ${response.statusText}`
      );
    }

    const rawCsv = await response.text();

    // Always parse to strip trailing empty columns from Google Sheets export
    const { headers, rows } = parseCsv(rawCsv);

    // Remove trailing empty-named columns (Google Sheets pads with "")
    const realHeaders = headers.filter((h) => h !== "");

    let filteredRows = rows;

    // Filter out rows where a column is empty/NA
    if (sheet.filterNotNull) {
      const col = sheet.filterNotNull;
      filteredRows = filteredRows.filter(
        (r) => r[col] && r[col].trim() !== "" && r[col] !== "NA"
      );
    }

    // Select specific columns, or use the cleaned headers
    const selectedHeaders = sheet.selectColumns ?? realHeaders;
    const csvText = toCsv(selectedHeaders, filteredRows);

    const rowCount = filteredRows.length;
    console.log(`    ${rowCount} rows, ${selectedHeaders.length} columns`);

    await Deno.writeTextFile(outPath, csvText);
  }
}
