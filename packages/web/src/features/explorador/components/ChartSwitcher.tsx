import { useExploradorStore } from "../store";
import type { ChartType } from "../types";
import barSvg from "../icons/bar.svg?raw";
import cardsSvg from "../icons/cards.svg?raw";
import donutSvg from "../icons/donut.svg?raw";
import mapSvg from "../icons/map.svg?raw";
import pieSvg from "../icons/pie.svg?raw";
import treemapSvg from "../icons/treemap.svg?raw";

const CHART_LABELS: Record<ChartType, string> = {
  map: "Mapa",
  cards: "Tarjetas",
  pie: "Torta",
  donut: "Dona",
  treemap: "Treemap",
  bar: "Barras",
};

const CHART_ORDER: ChartType[] = ["map", "cards", "pie", "donut", "treemap", "bar"];

/**
 * Rewrite hardcoded fill/stroke hex colors to `currentColor` so the
 * parent button's color cascade drives the icon (active = green
 * strokes, inactive = grey). Done once at module load.
 */
function tintable(raw: string): string {
  return raw
    .replace(/fill:\s*#[0-9a-fA-F]{3,8}/g, "fill:currentColor")
    .replace(/stroke:\s*#[0-9a-fA-F]{3,8}/g, "stroke:currentColor")
    .replace(/fill="#[0-9a-fA-F]{3,8}"/g, 'fill="currentColor"')
    .replace(/stroke="#[0-9a-fA-F]{3,8}"/g, 'stroke="currentColor"');
}

const SVGS: Record<ChartType, string> = {
  map: tintable(mapSvg),
  cards: tintable(cardsSvg),
  pie: tintable(pieSvg),
  donut: tintable(donutSvg),
  treemap: tintable(treemapSvg),
  bar: tintable(barSvg),
};

interface Props {
  available: ChartType[];
}

/**
 * Port of `buttonImageInput` at R/exp_viz_inputs.R:144-166. Active
 * button drives the icon strokes/fills to #09A274 via `currentColor`;
 * disabled buttons fade to a translucent grey.
 */
export function ChartSwitcher({ available }: Props) {
  const active = useExploradorStore((s) => s.chartType);
  const set = useExploradorStore((s) => s.setChartType);

  return (
    <div className="flex flex-wrap items-center gap-[5px]" role="toolbar" aria-label="Tipo de gráfico">
      {CHART_ORDER.map((c) => {
        const enabled = available.includes(c);
        const isActive = active === c;
        const color = isActive ? "#09A274" : enabled ? "#1a1a1a" : "#9ca3af";
        return (
          <button
            key={c}
            type="button"
            onClick={() => enabled && set(c)}
            disabled={!enabled}
            title={CHART_LABELS[c]}
            aria-pressed={isActive}
            aria-label={CHART_LABELS[c]}
            className={[
              "w-7 h-7 p-0 border-0 bg-transparent transition rounded",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dartmouth-green",
              enabled ? "cursor-pointer hover:opacity-80" : "cursor-not-allowed opacity-50",
            ].join(" ")}
            style={{ color }}
          >
            <span
              aria-hidden
              className="block w-7 h-7 [&>svg]:w-full [&>svg]:h-full"
              dangerouslySetInnerHTML={{ __html: SVGS[c] }}
            />
          </button>
        );
      })}
    </div>
  );
}
