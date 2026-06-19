import { useEffect, useMemo, useRef, useState } from "react";
import { utils, writeFile } from "xlsx";
import { useExploradorStore } from "../store";
import { useLabels, useSibdata } from "../api";
import { useDerivedIndicador } from "../lib/use-derived";
import { downloadFilename } from "../lib/download-filename";
import type { SibdataRow } from "../types";

function formatNumber(n: number | null | undefined): string {
  if (typeof n !== "number") return "Sin datos";
  return n.toLocaleString("es-CO");
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportCsv(rows: Record<string, unknown>[], filename: string) {
  if (rows.length === 0) return;
  const cols = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [
    cols.map(escape).join(","),
    ...rows.map((r) => cols.map((c) => escape(r[c])).join(",")),
  ];
  // BOM so Excel detects UTF-8 (Spanish accents stay correct).
  const blob = new Blob(["﻿" + lines.join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  downloadBlob(blob, filename);
}

function exportJson(rows: Record<string, unknown>[], filename: string) {
  if (rows.length === 0) return;
  const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" });
  downloadBlob(blob, filename);
}

function exportXlsx(rows: Record<string, unknown>[], filename: string) {
  if (rows.length === 0) return;
  const sheet = utils.json_to_sheet(rows);
  const book = utils.book_new();
  utils.book_append_sheet(book, sheet, "Datos");
  // Compression keeps the file size in line with the live Shiny export
  // (see SpeciesDownload.tsx for the same rationale).
  writeFile(book, filename, { compression: true });
}

interface DownloadDropdownProps {
  rows: Record<string, unknown>[];
  /** What the file holds (e.g. the chart type) + active explorer filters,
   * used to build the standardized Anexo §3 filename. */
  section: string;
  region?: string | null;
  grupo?: string | null;
  tema?: string | null;
  disabled?: boolean;
}

/**
 * Dropdown that mirrors the SpeciesDownload widget — same labels, same
 * three formats. Wired to whatever rows the parent assembled (so this
 * works for the chart-data modal as well as the species modal).
 */
function DownloadDropdown({ rows, section, region, grupo, tema, disabled }: DownloadDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const trigger =
    (fn: (r: Record<string, unknown>[], filename: string) => void, ext: string) =>
    () => {
      fn(rows, downloadFilename({ section, region, grupo, tema, ext }));
      setOpen(false);
    };

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={disabled || rows.length === 0}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-1 text-xs bg-[#09A274] text-white border border-[#09A274] rounded px-3 py-1.5 hover:bg-[#078a63] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <span>Descargar datos</span>
        <span aria-hidden className="text-[10px]">▼</span>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 mt-1 min-w-[160px] bg-white border border-gray-200 rounded shadow-lg z-10 py-1 text-sm">
          <button type="button" role="menuitem" onClick={trigger(exportCsv, "csv")} className="w-full text-left px-3 py-1.5 hover:bg-gray-50">
            Descargar CSV
          </button>
          <button type="button" role="menuitem" onClick={trigger(exportXlsx, "xlsx")} className="w-full text-left px-3 py-1.5 hover:bg-gray-50">
            Descargar XLSX
          </button>
          <button type="button" role="menuitem" onClick={trigger(exportJson, "json")} className="w-full text-left px-3 py-1.5 hover:bg-gray-50">
            Descargar JSON
          </button>
        </div>
      )}
    </div>
  );
}

function useActiveChartData(): {
  rows: SibdataRow[];
  isLoading: boolean;
  isError: boolean;
} {
  const region = useExploradorStore((s) => s.region);
  const tipo = useExploradorStore((s) => s.tipo);
  const grupo = useExploradorStore((s) => s.grupo);
  const chartType = useExploradorStore((s) => s.chartType);
  const { indicador, tematicaSlug, useAll: indicatorUseAll } = useDerivedIndicador();

  const subregiones = chartType === "map";
  // The single-indicator views force `all_indicators=false`; card/chart
  // views piggyback on whatever the derivation says (which already
  // covers the amenazadas/cites branches).
  const useAll = subregiones ? false : indicatorUseAll;

  const q = useSibdata(
    region
      ? {
          region,
          tipo,
          tematica: tematicaSlug,
          indicador: useAll ? null : indicador,
          grupo,
          subregiones,
          all_indicators: useAll,
        }
      : null,
  );

  return { rows: q.data ?? [], isLoading: q.isLoading, isError: q.isError };
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export function DataModal({ open, onClose }: Props) {
  const chartType = useExploradorStore((s) => s.chartType);
  const region = useExploradorStore((s) => s.region);
  const grupo = useExploradorStore((s) => s.grupo);
  const { tematicaSlug } = useDerivedIndicador();
  const { rows, isLoading, isError } = useActiveChartData();
  const slugs = useMemo(() => [...new Set(rows.map((r) => r.indicador))], [rows]);
  const labels = useLabels(slugs);
  // Hooks must run on every render — keep `useMemo` above any early
  // return so the hook count stays stable when `open` toggles. The
  // earlier ordering threw "Rendered more hooks than during the
  // previous render" the first time the modal opened (upstream #17).
  const flatRows = useMemo(
    () =>
      rows.map((r) => ({
        Region: r.label_region,
        Indicador: labels.data?.[r.indicador] ?? r.indicador,
        Valor: r.count,
      })),
    [rows, labels.data],
  );

  if (!open) return null;

  const titleMap: Record<string, string> = {
    map: "Datos del mapa",
    cards: "Datos de las tarjetas",
    pie: "Datos del gráfico",
    donut: "Datos del gráfico",
    bar: "Datos del gráfico",
    treemap: "Datos del gráfico",
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl max-w-3xl w-full p-6 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-lg">{titleMap[chartType] ?? "Datos"}</h4>
          <button
            type="button"
            onClick={onClose}
            className="text-2xl leading-none text-gray-500 hover:text-gray-900"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
        <div className="flex items-center justify-end mb-2">
          <DownloadDropdown
            rows={flatRows}
            section={chartType}
            region={region}
            grupo={grupo}
            tema={tematicaSlug}
          />
        </div>
        <div className="flex-1 overflow-auto border border-gray-200 rounded">
          {isLoading && <p className="p-4 text-sm text-gray-500">Cargando…</p>}
          {isError && <p className="p-4 text-sm text-red-600">Error al cargar datos.</p>}
          {!isLoading && !isError && rows.length === 0 && (
            <p className="p-4 text-sm text-gray-500">Sin datos.</p>
          )}
          {!isLoading && !isError && rows.length > 0 && (
            <table className="min-w-full text-sm">
              <thead className="bg-[#4ad3ac] text-white sticky top-0">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Región</th>
                  <th className="text-left px-3 py-2 font-medium">Indicador</th>
                  <th className="text-right px-3 py-2 font-medium">Número</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={`${r.slug_region}-${r.indicador}-${i}`} className="odd:bg-gray-50">
                    <td className="px-3 py-1.5">{r.label_region}</td>
                    <td className="px-3 py-1.5">{labels.data?.[r.indicador] ?? r.indicador}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{formatNumber(r.count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
