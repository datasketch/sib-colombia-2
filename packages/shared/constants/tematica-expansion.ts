/**
 * Tematica slug expansion rules — port of list_especies.R lines 44-63.
 * When a parent tematica slug is used, it expands to its child slugs.
 */

const EXPANSIONS: Record<string, string[]> = {
  cites: ["cites-i", "cites-i-ii", "cites-ii", "cites-iii"],
  "amenazadas-global": [
    "amenazadas-global-cr",
    "amenazadas-global-en",
    "amenazadas-global-vu",
  ],
  "amenazadas-nacional": [
    "amenazadas-nacional-cr",
    "amenazadas-nacional-en",
    "amenazadas-nacional-vu",
  ],
  amenazadas: [
    "amenazadas-global-cr",
    "amenazadas-global-en",
    "amenazadas-global-vu",
    "amenazadas-nacional-cr",
    "amenazadas-nacional-en",
    "amenazadas-nacional-vu",
  ],
  "exoticas-total": [
    "exoticas",
    "exoticas-riesgo-invasion-total",
    "invasoras",
    "trasplantadas",
  ],
};

/**
 * Expand a tematica slug to its child slugs.
 * If no expansion exists, returns the slug as a single-element array.
 * Also normalizes underscores to hyphens (R code does gsub("_", "-")).
 */
export function expandTematica(slug: string): string[] {
  const normalized = slug.replace(/_/g, "-");
  return EXPANSIONS[normalized] ?? [normalized];
}
