/**
 * Shared nivo theme — Lato across all chart text (spec §4). Nivo renders
 * SVG <text> with its own default sans-serif unless a theme sets the
 * font, so without this the charts drift off the site's Lato baseline.
 */
export const nivoTheme = {
  text: { fontFamily: "Lato, sans-serif", fontSize: 11, fill: "#1a1a1a" },
  axis: {
    ticks: { text: { fontFamily: "Lato, sans-serif", fontSize: 11, fill: "#4b5563" } },
  },
  tooltip: { container: { fontFamily: "Lato, sans-serif" } },
};
