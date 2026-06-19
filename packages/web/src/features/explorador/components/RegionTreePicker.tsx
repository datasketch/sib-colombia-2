import { useEffect, useMemo, useRef, useState } from "react";
import type { RegionTreeData } from "../lib/region-tree";

interface Props {
  id?: string;
  data: RegionTreeData;
  /** Selected region slug — `null`/empty clears. */
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  ariaLabel?: string;
}

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/** Section labels mirror the flat selector's `GROUP_ORDER`. */
const SECTION = {
  nacional: "Nacional",
  departamentos: "Departamentos",
  nucleos: "Núcleos (NDFyB)",
  especial: "Especial",
} as const;

/**
 * Region picker with department→municipio drill-down. Departments are
 * both selectable (click the label) and expandable (click the chevron)
 * to reveal their municipios. Two search levels:
 *   - a global box at the top that filters every section and auto-expands
 *     any department containing a match;
 *   - a per-department box inside each expanded branch that narrows just
 *     that department's municipios (Antioquia alone has 125).
 *
 * Keyboard (global box): ↑/↓ move through visible selectable rows, Enter
 * commits, Escape closes. The per-department boxes are type-to-filter,
 * commit-by-click. Click-outside uses the capture phase (see the CLAUDE
 * gotcha about re-renders dropping bubble-phase targets).
 */
export function RegionTreePicker({
  id,
  data,
  value,
  onChange,
  placeholder = "Seleccione una región...",
  disabled = false,
  ariaLabel,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [deptQuery, setDeptQuery] = useState<Record<string, string>>({});
  const [highlighted, setHighlighted] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);

  // Label for the trigger button. Municipios show "Departamento / Municipio"
  // so repeated names (there are several "La Unión") stay unambiguous.
  const selectedLabel = useMemo(() => {
    if (!value) return null;
    for (const r of data.nacional) if (r.value === value) return r.label;
    for (const d of data.departamentos) {
      if (d.value === value) return d.label;
      for (const m of d.municipios) {
        if (m.value === value) return `${d.label} / ${m.label}`;
      }
    }
    for (const r of data.nucleos) if (r.value === value) return r.label;
    for (const r of data.especial) if (r.value === value) return r.label;
    return null;
  }, [data, value]);

  const searching = query.trim().length > 0;
  const q = norm(query.trim());

  // Row descriptors in display order. `header`/`deptSearch` rows are not
  // keyboard-selectable; `leaf`/`dept` rows are.
  type Row =
    | { kind: "header"; label: string }
    | { kind: "leaf"; value: string; label: string; level: number }
    | { kind: "dept"; value: string; label: string; expanded: boolean }
    | { kind: "deptSearch"; dept: string };

  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    const matches = (label: string, slug: string) =>
      !q || norm(label).includes(q) || norm(slug).includes(q);

    // Nacional
    const nac = data.nacional.filter((r) => matches(r.label, r.value));
    if (nac.length) {
      out.push({ kind: "header", label: SECTION.nacional });
      for (const r of nac) out.push({ kind: "leaf", value: r.value, label: r.label, level: 0 });
    }

    // Departamentos
    const deptRows: Row[] = [];
    for (const d of data.departamentos) {
      const deptHit = matches(d.label, d.value);
      const muniHits = searching
        ? d.municipios.filter((m) => matches(m.label, m.value))
        : d.municipios;
      // While searching, only surface a department if it or one of its
      // municipios matched. Otherwise show every department.
      if (searching && !deptHit && muniHits.length === 0) continue;

      const isOpen = searching ? muniHits.length > 0 : expanded.has(d.value);
      deptRows.push({ kind: "dept", value: d.value, label: d.label, expanded: isOpen });
      if (!isOpen) continue;

      if (!searching) {
        deptRows.push({ kind: "deptSearch", dept: d.value });
      }
      const dq = norm((deptQuery[d.value] ?? "").trim());
      const munis = searching
        ? muniHits
        : dq
          ? d.municipios.filter((m) => norm(m.label).includes(dq) || norm(m.value).includes(dq))
          : d.municipios;
      for (const m of munis) {
        deptRows.push({ kind: "leaf", value: m.value, label: m.label, level: 1 });
      }
    }
    if (deptRows.length) {
      out.push({ kind: "header", label: SECTION.departamentos });
      out.push(...deptRows);
    }

    // Núcleos (NDFyB) — flat leaf list; only ~22, so no drill-down needed.
    const nuc = data.nucleos.filter((r) => matches(r.label, r.value));
    if (nuc.length) {
      out.push({ kind: "header", label: SECTION.nucleos });
      for (const r of nuc) out.push({ kind: "leaf", value: r.value, label: r.label, level: 0 });
    }

    // Especial
    const esp = data.especial.filter((r) => matches(r.label, r.value));
    if (esp.length) {
      out.push({ kind: "header", label: SECTION.especial });
      for (const r of esp) out.push({ kind: "leaf", value: r.value, label: r.label, level: 0 });
    }

    return out;
  }, [data, q, searching, expanded, deptQuery]);

  // Indices of keyboard-selectable rows (leaf + dept) for arrow nav.
  const selectableIdx = useMemo(
    () => rows.map((r, i) => (r.kind === "leaf" || r.kind === "dept" ? i : -1)).filter((i) => i >= 0),
    [rows],
  );

  useEffect(() => setHighlighted(0), [query, open]);

  useEffect(() => {
    if (open) {
      // Reset filters so reopening starts from the full tree, not the
      // previous search (matches GrupoTreePicker).
      setQuery("");
      setDeptQuery({});
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc, true);
    return () => document.removeEventListener("mousedown", onDoc, true);
  }, [open]);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-row="${highlighted}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [highlighted]);

  const commit = (val: string) => {
    onChange(val);
    setOpen(false);
  };

  const toggleExpand = (slug: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const moveHighlight = (dir: 1 | -1) => {
    if (selectableIdx.length === 0) return;
    const pos = selectableIdx.indexOf(highlighted);
    const nextPos =
      pos === -1
        ? dir === 1
          ? 0
          : selectableIdx.length - 1
        : Math.min(selectableIdx.length - 1, Math.max(0, pos + dir));
    setHighlighted(selectableIdx[nextPos]);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      moveHighlight(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      moveHighlight(-1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const row = rows[highlighted];
      if (row && (row.kind === "leaf" || row.kind === "dept")) commit(row.value);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="tree"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={[
          "w-full flex items-center justify-between border border-gray-300 rounded px-2 py-1.5 bg-white text-left",
          "focus:border-[#09A274] focus:outline-none focus-visible:ring-2 focus-visible:ring-dartmouth-green",
          disabled ? "opacity-50 cursor-not-allowed" : "hover:border-[#09A274]",
        ].join(" ")}
      >
        <span className={selectedLabel ? "" : "text-gray-400"}>
          {selectedLabel ?? placeholder}
        </span>
        <span aria-hidden className="text-gray-500 text-xs ml-2">▾</span>
      </button>

      {open && !disabled && (
        <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg">
          <div className="p-1.5 border-b border-gray-100">
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Buscar región o municipio..."
              className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:border-[#09A274] focus:outline-none"
            />
          </div>
          <ul ref={listRef} role="tree" className="max-h-72 overflow-auto py-1 text-sm">
            {rows.length === 0 && (
              <li className="px-3 py-2 text-gray-500 text-center">Sin regiones que coincidan</li>
            )}
            {rows.map((row, i) => {
              if (row.kind === "header") {
                return (
                  <li
                    key={`h-${row.label}`}
                    className="px-3 py-1 text-[11px] uppercase tracking-wide text-gray-500 bg-gray-50 sticky top-0"
                  >
                    {row.label}
                  </li>
                );
              }
              if (row.kind === "deptSearch") {
                return (
                  <li key={`s-${row.dept}`} className="pl-8 pr-3 py-1">
                    <input
                      type="search"
                      value={deptQuery[row.dept] ?? ""}
                      onChange={(e) =>
                        setDeptQuery((prev) => ({ ...prev, [row.dept]: e.target.value }))
                      }
                      placeholder="Buscar municipio..."
                      className="w-full border border-gray-200 rounded px-2 py-0.5 text-xs focus:border-[#09A274] focus:outline-none"
                    />
                  </li>
                );
              }
              const isHigh = i === highlighted;
              const isSel = row.value === value;
              const base = [
                "flex items-center gap-1 cursor-pointer pr-3 py-1.5",
                isHigh ? "bg-[#09A274] text-white" : "",
                isSel && !isHigh ? "bg-[#F2FBF8] text-[#09A274] font-medium" : "",
              ].join(" ");

              if (row.kind === "dept") {
                return (
                  <li
                    key={`d-${row.value}`}
                    data-row={i}
                    role="treeitem"
                    aria-selected={isSel}
                    aria-expanded={row.expanded}
                    onMouseEnter={() => setHighlighted(i)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      commit(row.value);
                    }}
                    className={base}
                    style={{ paddingLeft: "0.75rem" }}
                  >
                    <button
                      type="button"
                      aria-label={row.expanded ? "Contraer" : "Expandir"}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleExpand(row.value);
                      }}
                      className={[
                        "w-4 h-4 flex items-center justify-center rounded text-[10px] shrink-0",
                        isHigh ? "text-white" : "text-gray-500 hover:bg-gray-100",
                      ].join(" ")}
                    >
                      {row.expanded ? "▾" : "▸"}
                    </button>
                    <span className="font-medium">{row.label}</span>
                  </li>
                );
              }

              // leaf (nacional / municipio / especial)
              return (
                <li
                  key={`l-${row.value}`}
                  data-row={i}
                  role="treeitem"
                  aria-selected={isSel}
                  onMouseEnter={() => setHighlighted(i)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    commit(row.value);
                  }}
                  className={base}
                  style={{ paddingLeft: `${0.75 + row.level * 1.25}rem` }}
                >
                  <span aria-hidden className="w-4 h-4 shrink-0" />
                  <span>{row.label}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
