import { useEffect, useRef, useState } from "react";
import { utils, writeFile } from "xlsx";
import type { SpeciesRow } from "../types";
import { downloadFilename } from "../lib/download-filename";

/**
 * Spanish column order and headers used by the live app4 download
 * handler (R/exp_species_table.R + downloadTableServer). Verified
 * against /tmp/sib-dl/live-species.csv: 10 columns in this exact
 * order with these exact header names.
 */
const COLUMNS: { key: keyof SpeciesRow; header: string }[] = [
  { key: "especie", header: "Especie" },
  { key: "observaciones", header: "Observaciones" },
  { key: "url_gbif", header: "GBIF" },
  { key: "url_cbc", header: "CBC" },
  { key: "reino", header: "Reino" },
  { key: "filo", header: "Filo" },
  { key: "clase", header: "Clase" },
  { key: "orden", header: "Orden" },
  { key: "familia", header: "Familia" },
  { key: "genero", header: "Género" },
];

function toExportRows(rows: SpeciesRow[]): Record<string, unknown>[] {
  return rows.map((r) => {
    const out: Record<string, unknown> = {};
    for (const { key, header } of COLUMNS) {
      const v = (r as unknown as Record<string, unknown>)[key as string];
      out[header] = v === null || v === undefined ? "" : v;
    }
    return out;
  });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportCsv(rows: SpeciesRow[], filename: string) {
  const exportRows = toExportRows(rows);
  const headers = COLUMNS.map((c) => c.header);
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [
    headers.map((h) => escape(h)).join(","),
    ...exportRows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ];
  // BOM so Excel detects UTF-8 (Spanish accents stay correct).
  const blob = new Blob(["﻿" + lines.join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  downloadBlob(blob, filename);
}

function exportJson(rows: SpeciesRow[], filename: string) {
  const blob = new Blob([JSON.stringify(toExportRows(rows), null, 2)], {
    type: "application/json",
  });
  downloadBlob(blob, filename);
}

function exportXlsx(rows: SpeciesRow[], filename: string) {
  const sheet = utils.json_to_sheet(toExportRows(rows), {
    header: COLUMNS.map((c) => c.header),
  });
  const book = utils.book_new();
  utils.book_append_sheet(book, sheet, "Especies");
  // Explicit zip compression — without it 80k rows ballooned to 37 MB
  // vs ~4 MB on the live R app. With compression we land in the same
  // ballpark.
  writeFile(book, filename, { compression: true });
}

interface Props {
  rows: SpeciesRow[];
  /** Active explorer filters — used to build the Anexo §3 filename. */
  region?: string | null;
  grupo?: string | null;
  tema?: string | null;
}

/**
 * Dropdown matching `downloadTableUI(... formats=c("csv","xlsx","json"),
 * dropdownLabel="Descargar especies")` from R/exp_species_table.R:362.
 */
export function SpeciesDownload({ rows, region, grupo, tema }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const disabled = rows.length === 0;

  // Close on outside click and on Escape.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const trigger =
    (fn: (r: SpeciesRow[], filename: string) => void, ext: string) => () => {
      fn(rows, downloadFilename({ section: "especies", region, grupo, tema, ext }));
      setOpen(false);
    };

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-1 text-xs bg-[#09A274] text-white border border-[#09A274] rounded px-3 py-1.5 hover:bg-[#078a63] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <span>Descargar especies</span>
        <span aria-hidden className="text-[10px]">▼</span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-1 min-w-[170px] bg-white border border-gray-200 rounded shadow-lg z-10 py-1 text-sm"
        >
          <button
            type="button"
            role="menuitem"
            onClick={trigger(exportCsv, "csv")}
            className="w-full text-left px-3 py-1.5 hover:bg-gray-50"
          >
            Descargar CSV
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={trigger(exportXlsx, "xlsx")}
            className="w-full text-left px-3 py-1.5 hover:bg-gray-50"
          >
            Descargar XLSX
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={trigger(exportJson, "json")}
            className="w-full text-left px-3 py-1.5 hover:bg-gray-50"
          >
            Descargar JSON
          </button>
        </div>
      )}
    </div>
  );
}
