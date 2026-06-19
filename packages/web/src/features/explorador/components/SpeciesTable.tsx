import { Fragment, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useExploradorStore } from "../store";
import { useSpecies } from "../api";
import type { SpeciesRow } from "../types";
import { SpeciesDownload } from "./SpeciesDownload";

function titleCase(s: string): string {
  return s
    .split(/\s+/)
    .map((w) => (w.length === 0 ? w : w[0].toUpperCase() + w.slice(1).toLowerCase()))
    .join(" ");
}

function tematicaText(sub: string | null, tem: string | null): string {
  const slug = sub || tem;
  if (!slug) return "todas las temáticas";
  if (slug === "cites") return "CITES";
  if (slug.startsWith("cites-")) {
    const suf = slug.replace(/^cites-/, "");
    // Keep the I-II hyphen — only the slug separators (the leading
    // "cites-") get stripped, never the roman-numeral compound.
    return `CITES ${suf.toUpperCase()}`;
  }
  return slug.split(/[-_]/).map((p) => titleCase(p)).join("-");
}

interface SummaryInput {
  region: string | null;
  grupo: string | null;
  tematica: string | null;
  subtematica: string | null;
}

function summary(n: number, s: SummaryInput): string {
  const region = titleCase((s.region ?? "todas las regiones").replace(/-/g, " "));
  const tem = tematicaText(s.subtematica, s.tematica);
  const grupoLabel =
    !s.grupo || s.grupo === "" || s.grupo.toLowerCase() === "todos"
      ? "Todos"
      : titleCase(s.grupo.replace(/-/g, " "));
  return `Mostrando ${n.toLocaleString("es-CO")} especies para ${tem} en ${region} del grupo ${grupoLabel}`;
}

interface SpeciesGridProps {
  rows: SpeciesRow[];
  pageSize: number;
  scrollHeight: number;
  searchable: boolean;
  /** When true, render taxonomy columns (Reino…Género). The inline panel
   *  hides them; the modal exposes them. */
  withTaxonomy: boolean;
}

const TAXONOMY: { key: keyof SpeciesRow; label: string }[] = [
  { key: "reino", label: "Reino" },
  { key: "filo", label: "Filo" },
  { key: "clase", label: "Clase" },
  { key: "orden", label: "Orden" },
  { key: "familia", label: "Familia" },
  { key: "genero", label: "Género" },
];

// Accent-insensitive lookup — "ñu" matches "Ñu" / "ñU"; "araguaney"
// matches "Araguaney". Stripping combining marks on both sides lets
// "rana" match "Raña" too. Same helper as the Combobox.
function norm(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

type SortKey = "especie" | "observaciones" | keyof SpeciesRow;

function SpeciesGrid({ rows, pageSize, scrollHeight, searchable, withTaxonomy }: SpeciesGridProps) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>("observaciones");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    if (!query) return rows;
    const q = norm(query);
    return rows.filter(
      (r) =>
        norm(r.especie).includes(q) ||
        (r.vernacular_name_es ? norm(r.vernacular_name_es).includes(q) : false),
    );
  }, [rows, query]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const cmp =
        sortKey === "observaciones"
          ? a.observaciones - b.observaciones
          : String(a[sortKey] ?? "").localeCompare(String(b[sortKey] ?? ""), "es");
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const start = page * pageSize;
  const slice = sorted.slice(start, start + pageSize);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "observaciones" ? "desc" : "asc");
    }
    setPage(0);
  };

  const toggleExpand = (slug: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });

  const SortHeader = ({ k, label, align }: { k: SortKey; label: string; align: string }) => (
    <th className={`px-2 py-1.5 font-semibold ${align}`}>
      <button
        type="button"
        onClick={() => toggleSort(k)}
        className="inline-flex items-center gap-1 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dartmouth-green"
        aria-label={`Ordenar por ${label}`}
      >
        {label}
        <span aria-hidden className="text-[10px]">
          {sortKey === k ? (sortDir === "asc" ? "▲" : "▼") : "↕"}
        </span>
      </button>
    </th>
  );

  // caret + especie + obs + gbif + cbc (+ taxonomy when shown)
  const colCount = 5 + (withTaxonomy ? TAXONOMY.length : 0);

  return (
    <div>
      {searchable && (
        <input
          type="search"
          placeholder="Buscar especie…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(0);
          }}
          className="w-full border border-gray-300 rounded px-2 py-1 text-sm mb-2 focus:border-[#09A274] focus:outline-none focus-visible:ring-2 focus-visible:ring-dartmouth-green"
        />
      )}
      <div className="overflow-auto" style={{ maxHeight: scrollHeight }}>
        <table className="min-w-full text-xs whitespace-nowrap">
          <thead className="bg-[#4ad3ac] text-white sticky top-0">
            <tr>
              <th className="w-6 px-1 py-1.5" aria-hidden />
              <SortHeader k="especie" label="Especie" align="text-left" />
              <SortHeader k="observaciones" label="Observaciones" align="text-right" />
              <th className="text-left px-2 py-1.5 font-semibold">GBIF</th>
              <th className="text-left px-2 py-1.5 font-semibold">CBC</th>
              {withTaxonomy &&
                TAXONOMY.map((t) => (
                  <SortHeader key={t.key} k={t.key} label={t.label} align="text-left" />
                ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((r) => {
              const isOpen = expanded.has(r.slug_especie);
              return (
                <Fragment key={r.slug_especie}>
                  <tr className="odd:bg-gray-50">
                    <td className="px-1 py-1 text-center">
                      <button
                        type="button"
                        onClick={() => toggleExpand(r.slug_especie)}
                        aria-label={isOpen ? "Contraer taxonomía" : "Ver taxonomía"}
                        aria-expanded={isOpen}
                        className="text-gray-500 hover:text-[#09A274] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dartmouth-green rounded"
                      >
                        {isOpen ? "▾" : "▸"}
                      </button>
                    </td>
                    <td className="px-2 py-1 italic">{r.especie}</td>
                    <td className="px-2 py-1 text-right tabular-nums">
                      {r.observaciones.toLocaleString("es-CO")}
                    </td>
                    <td className="px-2 py-1">
                      {r.url_gbif && (
                        <a
                          href={r.url_gbif}
                          target="_blank"
                          rel="noopener"
                          className="text-[#09A274] underline"
                        >
                          GBIF
                        </a>
                      )}
                    </td>
                    <td className="px-2 py-1">
                      {r.url_cbc && (
                        <a
                          href={r.url_cbc}
                          target="_blank"
                          rel="noopener"
                          className="text-[#09A274] underline"
                        >
                          CBC
                        </a>
                      )}
                    </td>
                    {withTaxonomy &&
                      TAXONOMY.map((t) => (
                        <td key={t.key} className="px-2 py-1 text-gray-700">
                          {(r[t.key] as string | undefined) ?? ""}
                        </td>
                      ))}
                  </tr>
                  {isOpen && (
                    <tr className="bg-[#F2FBF8]">
                      <td colSpan={colCount} className="px-3 py-1.5 text-gray-600">
                        <span className="flex flex-wrap items-center gap-x-1 gap-y-0.5">
                          {TAXONOMY.map((t, i) => {
                            const v = (r[t.key] as string | undefined) ?? "—";
                            return (
                              <span key={t.key}>
                                {i > 0 && <span aria-hidden className="text-gray-400">→ </span>}
                                <span className="text-gray-400">{t.label}: </span>
                                {v}
                              </span>
                            );
                          })}
                        </span>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="flex items-center justify-between text-xs mt-2">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="px-2 py-0.5 border border-gray-300 rounded disabled:opacity-40"
          >
            ← Anterior
          </button>
          <span className="text-gray-600">
            Página {page + 1} de {pages}
          </span>
          <button
            type="button"
            disabled={page >= pages - 1}
            onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
            className="px-2 py-0.5 border border-gray-300 rounded disabled:opacity-40"
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}

export function SpeciesTable() {
  const region = useExploradorStore((s) => s.region);
  const grupo = useExploradorStore((s) => s.grupo);
  const tematica = useExploradorStore((s) => s.tematica);
  const subtematica = useExploradorStore((s) => s.subtematica);
  const [params] = useSearchParams();
  const [modalOpen, setModalOpen] = useState(false);
  const [autoShown, setAutoShown] = useState(false);

  const tematicaParam = subtematica ?? tematica;
  const q = useSpecies(
    region ? { region, grupo, tematica: tematicaParam } : null,
  );
  const summaryInput = { region, grupo, tematica, subtematica };

  const rows = q.data ?? [];

  // URL ?lista_especies=true auto-opens the modal once per session.
  useEffect(() => {
    if (autoShown) return;
    if (params.get("lista_especies")?.toLowerCase() === "true" && rows.length > 0) {
      setModalOpen(true);
      setAutoShown(true);
    }
  }, [params, rows.length, autoShown]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h5 className="font-medium">Lista de Especies</h5>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          disabled={rows.length === 0}
          className="text-xs border border-[#09A274] text-[#09A274] rounded px-2 py-1 disabled:opacity-40"
        >
          Ver lista completa
        </button>
      </div>

      {q.isLoading && (
        <div
          className="space-y-1.5 animate-pulse"
          aria-label="Cargando lista de especies"
          role="status"
        >
          <div className="h-3 bg-gray-100 rounded w-3/4 mb-3" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-4 bg-gray-100 rounded" />
          ))}
        </div>
      )}
      {q.isError && (
        <div className="border border-red-200 bg-red-50 text-red-800 p-2 rounded text-xs">
          <div className="font-semibold">Error al cargar especies</div>
          <div className="font-mono break-all">
            {(q.error as Error | null)?.message ?? "desconocido"}
          </div>
          <button
            type="button"
            onClick={() => void q.refetch()}
            className="mt-2 text-xs border border-red-300 text-red-800 rounded px-2 py-1 hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dartmouth-green"
          >
            Reintentar
          </button>
        </div>
      )}

      {!q.isLoading && !q.isError && (
        <>
          <p className="text-xs text-gray-600">{summary(rows.length, summaryInput)}</p>
          <SpeciesGrid rows={rows} pageSize={10} scrollHeight={300} searchable={false} withTaxonomy={false} />
        </>
      )}

      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-white rounded-lg shadow-2xl max-w-4xl w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-lg">Lista Completa de Especies</h4>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-2xl leading-none text-gray-500 hover:text-gray-900"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-3">{summary(rows.length, summaryInput)}</p>
            <div className="flex items-center justify-end mb-3">
              <SpeciesDownload
                rows={rows}
                region={region}
                grupo={grupo}
                tema={tematicaParam}
              />
            </div>
            <SpeciesGrid rows={rows} pageSize={25} scrollHeight={400} searchable={true} withTaxonomy={true} />
          </div>
        </div>
      )}
    </div>
  );
}
