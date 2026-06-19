/**
 * Standardized download filenames for the explorer (Anexo Técnico No. 1 §3:
 * "estandarizar descargas — nombre = tema + región").
 *
 * Shape: sibcol_{región}[_{grupo}][_{tema}]_{section}_{yyyymmdd}.{ext}
 *
 *   sibcol_region-amazonia_insectos_cites_especies_20260604.csv
 *   sibcol_colombia_especies_20260604.csv
 *
 * Región is always present (the explorer always has a region selected);
 * grupo and tema are appended only when they actually narrow the query, so
 * an unfiltered download stays short.
 */

function slugSafe(s: string | null | undefined): string | null {
  if (!s) return null;
  const v = s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return v || null;
}

function yyyymmdd(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

export interface DownloadFilenameOpts {
  /** What the file contains, e.g. "especies" or a chart type like "bar". */
  section: string;
  region?: string | null;
  grupo?: string | null;
  /** Active theme: pass `subtematica ?? tematica`. */
  tema?: string | null;
  ext: string;
}

export function downloadFilename(opts: DownloadFilenameOpts): string {
  const parts = ["sibcol", slugSafe(opts.region) ?? "colombia"];

  const grupo = slugSafe(opts.grupo);
  if (grupo && grupo !== "todos") parts.push(grupo);

  const tema = slugSafe(opts.tema);
  if (tema) parts.push(tema);

  parts.push(slugSafe(opts.section) ?? "datos");
  parts.push(yyyymmdd());

  return `${parts.join("_")}.${opts.ext}`;
}
