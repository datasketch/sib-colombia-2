import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  REGION_SECTION_LABEL,
  REGION_SECTION_ORDER,
  regionsToSearchList,
  searchRegions,
  useRegions,
  type RegionGroup,
  type RegionSearchResult,
} from "../../lib/region-nav";

interface Props {
  /** Desktop = white dropdown panel; mobile = inline on the dark drawer. */
  variant: "desktop" | "mobile";
  /** Shown when the query is empty (the existing category browse UI). */
  browse: ReactNode;
}

/**
 * Search-first region picker for the navbar's "Regiones" menu. Empty query
 * shows the `browse` fallback (category drill-down); typing filters every
 * region — departments, municipios, núcleos, especiales — live from
 * `/api/regions`. Mirrors the explorer's global region search.
 *
 * Keyboard: ↑/↓ move through results, Enter navigates, Escape clears.
 */
export function RegionSearchBox({ variant, browse }: Props) {
  const { data, isLoading, error } = useRegions();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const listRef = useRef<HTMLUListElement | null>(null);

  const all = useMemo(() => regionsToSearchList(data ?? []), [data]);
  const results = useMemo(() => searchRegions(all, query), [all, query]);
  const searching = query.trim().length > 0;

  // Group the flat results back into sections for display.
  const sections = useMemo(() => {
    return REGION_SECTION_ORDER.map((group) => ({
      group,
      label: REGION_SECTION_LABEL[group],
      items: results.filter((r) => r.group === group),
    })).filter((s) => s.items.length > 0);
  }, [results]);

  // Flat order of results = keyboard navigation order (matches the sections).
  const flatResults = useMemo(() => sections.flatMap((s) => s.items), [sections]);

  useEffect(() => setHighlighted(0), [query]);
  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-row="${highlighted}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [highlighted]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!searching || flatResults.length === 0) {
      if (e.key === "Escape") setQuery("");
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(flatResults.length - 1, h + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(0, h - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const r = flatResults[highlighted];
      if (r) navigate(r.href); // route change closes the menu
    } else if (e.key === "Escape") {
      e.preventDefault();
      setQuery("");
    }
  };

  const isMobile = variant === "mobile";
  const inputCls = isMobile
    ? "w-full rounded px-2 py-1.5 text-sm text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-green"
    : "w-full border border-gray-200 rounded px-2 py-1.5 text-sm text-black focus:border-dartmouth-green focus:outline-none focus-visible:ring-2 focus-visible:ring-dartmouth-green";

  let flatIdx = 0;

  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Buscar región o municipio..."
        aria-label="Buscar región o municipio"
        className={inputCls}
      />

      {!searching ? (
        <div className="mt-2">{browse}</div>
      ) : (
        <ul
          ref={listRef}
          className={`mt-2 max-h-72 overflow-auto text-sm font-lato ${
            isMobile ? "text-white" : "text-black"
          }`}
        >
          {error && (
            <li className="px-2 py-2 text-xs text-flame">
              Error al cargar regiones: {error.message}
            </li>
          )}
          {!error && isLoading && (
            <li className="px-2 py-2 text-xs text-gray-400">Cargando regiones…</li>
          )}
          {!error && !isLoading && flatResults.length === 0 && (
            <li className="px-2 py-2 text-xs text-gray-400">Sin regiones que coincidan</li>
          )}
          {sections.map((section) => (
            <li key={section.group}>
              <p
                className={`px-2 pt-2 pb-1 text-[11px] uppercase tracking-wide ${
                  isMobile ? "text-yellow-green/70" : "text-gray-500"
                }`}
              >
                {section.label}
              </p>
              <ul>
                {section.items.map((r) => {
                  const i = flatIdx++;
                  return (
                    <ResultRow
                      key={`${r.group}-${r.value}`}
                      result={r}
                      index={i}
                      highlighted={i === highlighted}
                      isMobile={isMobile}
                      onHover={() => setHighlighted(i)}
                    />
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ResultRow({
  result,
  index,
  highlighted,
  isMobile,
  onHover,
}: {
  result: RegionSearchResult;
  index: number;
  highlighted: boolean;
  isMobile: boolean;
  onHover: () => void;
}) {
  const active = highlighted
    ? isMobile
      ? "bg-white/15"
      : "bg-dartmouth-green text-white"
    : "";
  return (
    <li data-row={index}>
      <Link
        to={result.href}
        onMouseEnter={onHover}
        className={`block px-2 py-1.5 rounded cursor-pointer ${active} ${
          highlighted ? "" : isMobile ? "hover:bg-white/10" : "hover:bg-gray-50"
        }`}
      >
        {result.label}
      </Link>
    </li>
  );
}

// Re-exported so callers can keep the grouping type handy.
export type { RegionGroup };
