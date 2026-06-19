import { useEffect, useMemo, useRef, useState } from "react";

export interface ComboItem {
  value: string;
  label: string;
  /** Optional group header — used to render <optgroup>-style sections. */
  group?: string;
}

interface Props {
  id?: string;
  items: ComboItem[];
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Display when nothing matches the query. */
  emptyText?: string;
  disabled?: boolean;
  /** Aria-label / visible label hook. */
  ariaLabel?: string;
}

/**
 * Type-to-filter combobox. Replaces the native <select> when the option
 * list is too long to scroll comfortably (regiones ≈ 80 entries, grupo
 * de interés 100+). Behavior modeled after Selectize.js since that's
 * what the legacy R Shiny app uses.
 *
 * Keyboard: ↑/↓ navigate the filtered list, Enter commits, Escape
 * closes. Click-outside closes. The trigger button shows the current
 * label; opening focuses the search input.
 */
export function Combobox({
  id,
  items,
  value,
  onChange,
  placeholder = "Seleccione...",
  emptyText = "Sin resultados",
  disabled = false,
  ariaLabel,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);

  const selected = useMemo(() => items.find((i) => i.value === value), [items, value]);

  const norm = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase();

  // Filtered + grouped view.
  const groups = useMemo(() => {
    const q = norm(query.trim());
    const filtered = q
      ? items.filter((i) => norm(i.label).includes(q) || norm(i.value).includes(q))
      : items;
    const map = new Map<string, ComboItem[]>();
    for (const it of filtered) {
      const key = it.group ?? "";
      const bucket = map.get(key) ?? [];
      bucket.push(it);
      map.set(key, bucket);
    }
    return Array.from(map.entries()).map(([group, list]) => ({ group, list }));
  }, [items, query]);

  // Flat list (in display order) for arrow-key navigation.
  const flat = useMemo(() => groups.flatMap((g) => g.list), [groups]);

  // Reset highlight when the filter changes.
  useEffect(() => {
    setHighlighted(0);
  }, [query]);

  // Focus the search box and pre-fill with the selected label when opened.
  useEffect(() => {
    if (open) {
      setQuery("");
      // Defer to next tick — the input is mounted on open.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  // Keep the highlighted item visible.
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${highlighted}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [highlighted]);

  const commit = (it: ComboItem) => {
    onChange(it.value);
    setOpen(false);
  };

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
      if (it) commit(it);
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
        aria-haspopup="listbox"
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
            role="listbox"
            className="max-h-64 overflow-auto py-1 text-sm"
          >
            {flat.length === 0 && (
              <li className="px-3 py-2 text-gray-500 text-center">{emptyText}</li>
            )}
            {(() => {
              let idx = 0;
              return groups.map((g) => (
                <li key={g.group || "_"}>
                  {g.group && (
                    <div className="px-3 py-1 text-[11px] uppercase tracking-wide text-gray-500 bg-gray-50 sticky top-0">
                      {g.group}
                    </div>
                  )}
                  <ul>
                    {g.list.map((it) => {
                      const i = idx++;
                      const isHigh = i === highlighted;
                      const isSel = it.value === value;
                      return (
                        <li
                          key={it.value}
                          data-idx={i}
                          role="option"
                          aria-selected={isSel}
                          onMouseEnter={() => setHighlighted(i)}
                          onMouseDown={(e) => {
                            // mouseDown so we commit BEFORE the input loses
                            // focus and the outside-click handler closes us.
                            e.preventDefault();
                            commit(it);
                          }}
                          className={[
                            "px-3 py-1.5 cursor-pointer",
                            isHigh ? "bg-[#09A274] text-white" : "",
                            isSel && !isHigh ? "bg-[#F2FBF8] text-[#09A274] font-medium" : "",
                          ].join(" ")}
                        >
                          {it.label}
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ));
            })()}
          </ul>
        </div>
      )}
    </div>
  );
}
