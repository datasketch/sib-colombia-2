import type { ChartType, FilterState } from "../types.ts";

export const ALL_CHARTS: readonly ChartType[] = [
  "map",
  "cards",
  "pie",
  "donut",
  "bar",
  "treemap",
];

/**
 * Regions shown with a *locator* map (the region highlighted in context)
 * rather than a choropleth, because they have no subregional data surface
 * of their own. Individual leaf regions (municipios, núcleos) are flagged
 * separately via `isLeaf` — see `usesLocator`. Was the
 * `special_regions_disable_map` set in R/exp_viz_inputs.R:93-98, but the
 * cartography locator (`GET /api/locator/<slug>.svg`) means these now show
 * a map after all.
 */
export const LOCATOR_REGIONS: ReadonlySet<string> = new Set([
  "region-amazonia",
  "reserva-forestal-la-planada",
  "resguardo-indigena-pialapi-pueblo-viejo",
  "bogota-dc",
]);

/**
 * Whether `region` shows a locator map instead of a choropleth — true for
 * leaf regions (municipios / núcleos, flagged by the caller) and the
 * special `LOCATOR_REGIONS`. The "Mapa" chart is available either way;
 * this only decides which renderer the view uses.
 */
export function usesLocator(region: string | null, isLeaf: boolean): boolean {
  return isLeaf || (!!region && LOCATOR_REGIONS.has(region));
}

/**
 * Port of the availability observer in R/exp_viz_inputs.R:81-141. `map` is
 * always available now — regions with subregions render a choropleth,
 * leaf/special regions render a locator (see `usesLocator`) — so chart
 * availability depends only on the temática.
 */
export function availableCharts(
  s: Pick<FilterState, "tematica" | "subtematica" | "amenazadasCategoria">,
): ChartType[] {
  let out: ChartType[] = ["map", "cards"];

  if (s.tematica) {
    const hasSub = !!s.subtematica;
    const isFullChartParent =
      s.tematica === "amenazadas-global" ||
      s.tematica === "amenazadas-nacional" ||
      s.tematica === "cites";

    if (s.tematica.includes("exoticas")) {
      out = ["map", "cards"];
    } else if (isFullChartParent && !hasSub) {
      out = ["map", "cards", "pie", "donut", "treemap", "bar"];
    } else if (s.amenazadasCategoria === "_total") {
      out = ["map", "cards", "pie", "donut", "treemap", "bar"];
    } else {
      out = ["map", "cards"];
    }
  }

  return out;
}

/**
 * When the active `chartType` falls out of the available set, fall back
 * to `map`, then `cards`, then the first available. Port of the auto-
 * fallback in R/exp_viz_inputs.R:127-135.
 */
export function pickFallbackChart(available: ChartType[]): ChartType {
  if (available.includes("map")) return "map";
  if (available.includes("cards")) return "cards";
  return available[0] ?? "cards";
}
