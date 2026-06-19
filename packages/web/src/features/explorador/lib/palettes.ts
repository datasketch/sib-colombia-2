/**
 * Category palettes for Nivo charts. Port of R/exp_charts.R:121-130.
 */
export const CHART_PALETTES: Record<string, string[]> = {
  amenazadas: ["#d9453d", "#d8783d", "#d7a900"],
  cites: ["#00AFFF", "#000000", "#FFD150", "#4DD3AC"],
  default: ["#09A274", "#4ad3ac", "#00AFFF", "#FFD150", "#d8783d", "#d9453d"],
};

export function paletteFor(tematica: string | null): string[] {
  if (!tematica) return CHART_PALETTES.default;
  if (tematica.includes("amenazadas")) return CHART_PALETTES.amenazadas;
  if (tematica.includes("cites")) return CHART_PALETTES.cites;
  return CHART_PALETTES.default;
}

/**
 * Choropleth map palettes, keyed by regex on the `indicador` slug
 * suffix. Port of R/map.R:36-52. Returned as `[pale, deep]` — the caller
 * builds a `d3.scaleLinear().domain([max, min]).range([pale, deep])` so
 * that higher values land at the deeper color.
 */
export const MAP_PALETTES: readonly [RegExp, [string, string]][] = [
  [/amenaza.*_cr$/, ["#f9c9c9", "#d9453d"]],
  [/amenaza.*_en$/, ["#ffe9d9", "#d8783d"]],
  [/amenaza.*_vu$/, ["#fff9d9", "#d7a900"]],
  [/cites.*_iii$/, ["#daf2cc", "#4DD3AC"]],
  [/cites.*_ii$/, ["#fff9d9", "#FFD150"]],
  [/cites.*_i$/, ["#daf0ff", "#00AFFF"]],
  [/cites.*_i_ii$/, ["#dcdcdc", "#000000"]],
];

export const DEFAULT_MAP_PALETTE: [string, string] = ["#b6ecbf", "#29567d"];

export function mapPaletteFor(indicador: string | null): [string, string] {
  if (!indicador) return DEFAULT_MAP_PALETTE;
  for (const [re, pal] of MAP_PALETTES) {
    if (re.test(indicador)) return pal;
  }
  return DEFAULT_MAP_PALETTE;
}
