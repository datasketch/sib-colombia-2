import { useEffect, useMemo, useRef, useState } from "react";

export interface TreeItem {
  value: string;
  label: string;
  /** Slug of the parent row. `null` (or `"0"` from the seed sentinel) for roots. */
  parent: string | null;
  /** Depth in the tree (0 for roots, 1 for children, …). */
  level: number;
}

interface Props {
  id?: string;
  /**
   * Flat list in depth-first tree order (parents come before their
   * descendants). The picker rebuilds the parent→children map locally.
   */
  items: TreeItem[];
  /** Selected value — `null`/empty string clears the selection. */
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
  disabled?: boolean;
  ariaLabel?: string;
  /**
   * Optional sentinel item rendered above the tree (e.g. "Todos").
   * Picked the same way as a tree row but never indented.
   */
  rootOption?: { value: string; label: string };
}

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/**
 * Tree-shaped variant of `<Combobox>` for grupo selection. Nested rows
 * sit under disclosure chevrons; type-to-filter expands every ancestor
 * of a match so the path stays visible.
 *
 * Used in `<GrupoPanel>` because grupo_biologico has a real two-level
 * hierarchy (animales → insectos → libélulas) that the legacy R Shiny
 * app rendered with prepended dashes — clearer here as actual indented
 * rows with chevrons.
 */
export function GrupoTreePicker({
  id,
  items,
  value,
  onChange,
  placeholder = "Seleccione...",
  emptyText = "Sin resultados",
  disabled = false,
  ariaLabel,
  rootOption,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [highlighted, setHighlighted] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);

  // Build adjacency once per items prop. The seed uses "0" as the
  // root-parent sentinel; treat both "0" and null as "no parent".
  const byParent = useMemo(() => {
    const m = new Map<string | null, TreeItem[]>();
    for (const it of items) {
      const p = it.parent === "0" ? null : it.parent;
      const list = m.get(p) ?? [];
      list.push(it);
      m.set(p, list);
    }
    return m;
  }, [items]);

  const childrenOf = (slug: string) => byParent.get(slug) ?? [];
  const hasChildren = (slug: string) => childrenOf(slug).length > 0;

  // For each match in a search, force-expand every ancestor so the
  // path is visible. With no query, honor the user's manual expand state.
  const visible = useMemo(() => {
    const q = norm(query.trim());
    if (!q) {
      const ancestorsCollapsedHidden = (it: TreeItem): boolean => {
        if (it.parent == null || it.parent === "0") return false;
        // Walk up: if any ancestor is collapsed, hide.
        let cur: TreeItem | undefined = items.find((x) => x.value === it.parent);
        while (cur) {
          if (!expanded.has(cur.value)) return true;
          if (cur.parent == null || cur.parent === "0") break;
          cur = items.find((x) => x.value === cur!.parent);
        }
        return false;
      };
      return items.filter((it) => !ancestorsCollapsedHidden(it));
    }

    // Search mode: find direct matches, then walk up to include ancestors.
    const direct = new Set<string>();
    for (const it of items) {
      if (norm(it.label).includes(q) || norm(it.value).includes(q)) {
        direct.add(it.value);
      }
    }
    const include = new Set<string>(direct);
    for (const slug of direct) {
      let cur: TreeItem | undefined = items.find((x) => x.value === slug);
      while (cur && cur.parent && cur.parent !== "0") {
        include.add(cur.parent);
        cur = items.find((x) => x.value === cur!.parent);
      }
    }
    return items.filter((it) => include.has(it.value));
  }, [items, query, expanded]);

  // Reset highlight whenever the visible-list shape changes.
  useEffect(() => {
    setHighlighted(0);
  }, [visible.length]);

  // Open behavior: clear search + focus.
  useEffect(() => {
    if (open) {
      setQuery("");
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Click-outside close. Capture phase so a re-render between mousedown
  // and the bubble handler doesn't drop us out of the DOM (see CLAUDE
  // gotcha about click-outside listeners).
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${highlighted}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [highlighted]);

  const selected = useMemo(
    () =>
      rootOption && value === rootOption.value
        ? { value: rootOption.value, label: rootOption.label }
        : items.find((i) => i.value === value),
    [items, value, rootOption],
  );

  const toggleExpand = (slug: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const commit = (val: string) => {
    onChange(val);
    setOpen(false);
  };

  // Flat sequence used for arrow-key navigation. Index 0 is the optional
  // rootOption row; the rest are visible tree rows in display order.
  const flat: { value: string; label: string }[] = useMemo(() => {
    const arr: { value: string; label: string }[] = [];
    if (rootOption) arr.push(rootOption);
    for (const it of visible) arr.push({ value: it.value, label: it.label });
    return arr;
  }, [rootOption, visible]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(flat.length - 1, h + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(0, h - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const it = flat[highlighted];
      if (it) commit(it.value);
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
        <span className={selected ? "" : "text-gray-400"}>
          {selected ? selected.label : placeholder}
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
              placeholder="Buscar..."
              className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:border-[#09A274] focus:outline-none"
            />
          </div>
          <ul
            ref={listRef}
            role="tree"
            className="max-h-64 overflow-auto py-1 text-sm"
          >
            {flat.length === 0 && (
              <li className="px-3 py-2 text-gray-500 text-center">{emptyText}</li>
            )}

            {rootOption && (() => {
              const i = 0;
              const isHigh = i === highlighted;
              const isSel = rootOption.value === value;
              return (
                <li
                  key="__root__"
                  data-idx={i}
                  role="treeitem"
                  aria-selected={isSel}
                  onMouseEnter={() => setHighlighted(i)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    commit(rootOption.value);
                  }}
                  className={[
                    "px-3 py-1.5 cursor-pointer border-b border-gray-100",
                    isHigh ? "bg-[#09A274] text-white" : "",
                    isSel && !isHigh ? "bg-[#F2FBF8] text-[#09A274] font-medium" : "",
                  ].join(" ")}
                >
                  {rootOption.label}
                </li>
              );
            })()}

            {visible.map((it, vi) => {
              const i = (rootOption ? 1 : 0) + vi;
              const isHigh = i === highlighted;
              const isSel = it.value === value;
              const branch = hasChildren(it.value);
              const isOpen = expanded.has(it.value) || query.trim().length > 0;
              return (
                <li
                  key={it.value}
                  data-idx={i}
                  role="treeitem"
                  aria-selected={isSel}
                  aria-expanded={branch ? isOpen : undefined}
                  onMouseEnter={() => setHighlighted(i)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    commit(it.value);
                  }}
                  className={[
                    "flex items-center gap-1 cursor-pointer pr-3 py-1.5",
                    isHigh ? "bg-[#09A274] text-white" : "",
                    isSel && !isHigh ? "bg-[#F2FBF8] text-[#09A274] font-medium" : "",
                  ].join(" ")}
                  style={{ paddingLeft: `${0.75 + it.level * 1}rem` }}
                >
                  {branch ? (
                    <button
                      type="button"
                      aria-label={isOpen ? "Contraer" : "Expandir"}
                      onMouseDown={(e) => {
                        // Stop the row's onMouseDown so toggling the
                        // chevron doesn't also commit the parent slug.
                        e.preventDefault();
                        e.stopPropagation();
                        toggleExpand(it.value);
                      }}
                      className={[
                        // Bigger tap target for the disclosure toggle (#18:
                        // "ampliar la zona de impacto del botón desplegable").
                        // w-6 h-6 = 24px clickable; -m-1 cancels 4px each side
                        // so the layout footprint stays 16px (no row shift, and
                        // leaf-row w-4 spacers still align).
                        "w-6 h-6 -m-1 flex items-center justify-center rounded text-[10px] shrink-0",
                        isHigh ? "text-white" : "text-gray-500 hover:bg-gray-100",
                      ].join(" ")}
                    >
                      {isOpen ? "▾" : "▸"}
                    </button>
                  ) : (
                    <span aria-hidden className="w-4 h-4 shrink-0" />
                  )}
                  <span className={branch ? "font-medium" : ""}>{it.label}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
