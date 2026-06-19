interface Item {
  label: string;
  color: string;
  value?: number;
}

interface Props {
  items: Item[];
  /** Show the numeric value next to each label. */
  showValues?: boolean;
}

/**
 * Horizontal legend rendered below a chart. Wraps to multiple rows
 * when items are many, keeping each label readable.
 */
export function ChartLegend({ items, showValues = true }: Props) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-2 pb-1 pt-2 text-xs text-gray-700">
      {items.map((it) => (
        <div key={it.label} className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="inline-block w-3 h-3 rounded-sm"
            style={{ background: it.color }}
          />
          <span>{it.label}</span>
          {showValues && typeof it.value === "number" && (
            <span className="text-gray-500 tabular-nums">
              ({it.value.toLocaleString("es-CO")})
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
