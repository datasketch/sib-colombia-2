import type { FilterState } from "../types.ts";

/**
 * Port of `calculate_indicador_viz()` in
 * the legacy reference:205-243.
 *
 * Input is the filter state; output is the `indicador` slug to query.
 * `especiesEst` ("total" | "estimadas") comes from an unused R field
 * and defaults to "total" — kept here only to match the R signature
 * for parity tests.
 */
export function calculateIndicador(
  s: Pick<
    FilterState,
    "tipo" | "tematica" | "subtematica" | "amenazadasCategoria" | "chartType"
  >,
  especiesEst: "total" | "estimadas" = "total",
): string | null {
  const { tipo, tematica, subtematica, amenazadasCategoria, chartType } = s;
  const t = tematica ? tematica.replace(/-/g, "_") : null;

  if (!tematica) {
    if (tipo === "especies" && especiesEst === "total") return "especies_region_total";
    if (tipo === "especies" && especiesEst === "estimadas") return "especies_region_estimadas";
    return "registros_region_total";
  }

  if (tematica.includes("exoticas")) {
    if (tematica === "exoticas-total") {
      return subtematica ? `${tipo}_${subtematica.replace(/-/g, "_")}` : null;
    }
    return `${tipo}_${t}`;
  }

  // Amenazadas category feeds subtematica — caller is expected to set
  // subtematica = "<child>-<cat>" when amenazadasCategoria !== "_total".
  if (subtematica && subtematica !== "") {
    return `${tipo}_${subtematica.replace(/-/g, "_")}`;
  }

  if (tematica.includes("amenazadas") || tematica.includes("cites")) {
    if (chartType === "map") return `${tipo}_${t}_total`;
    return `${tipo}_${t}`;
  }

  return `${tipo}_${t}`;
}

/**
 * Helper: derive the effective `subtematica` from amenazadas UI state.
 * Used by the filter store before calling `calculateIndicador`. Mirrors
 * the logic in R/exp_inputs_tematica.R:954-965.
 *
 *   amenazadasCategoria "_total" → no subtematica
 *   "_en" | "_cr" | "_vu"        → `${tematica}-${cat}`
 */
export function deriveAmenazadasSubtematica(
  tematica: string | null,
  amenazadasCategoria: FilterState["amenazadasCategoria"],
): string | null {
  if (!tematica) return null;
  if (!(tematica === "amenazadas-global" || tematica === "amenazadas-nacional")) return null;
  if (!amenazadasCategoria || amenazadasCategoria === "_total") return null;
  return `${tematica}-${amenazadasCategoria.replace(/^_/, "")}`;
}
