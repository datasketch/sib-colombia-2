import { useMemo } from "react";
import { useExploradorStore } from "../store";
import type { ChartType } from "../types";
import { calculateIndicador, deriveAmenazadasSubtematica } from "./indicador";

/**
 * Memoized `subtematica` that folds in the amenazadas-categoria radios.
 * `store.setAmenazadasCategoria` also calls the pure
 * `deriveAmenazadasSubtematica` directly (not via this hook) because it
 * writes state before the next render.
 */
export function useEffectiveSubtematica(): string | null {
  const tematica = useExploradorStore((s) => s.tematica);
  const subtematica = useExploradorStore((s) => s.subtematica);
  const amenazadasCategoria = useExploradorStore((s) => s.amenazadasCategoria);

  return useMemo(
    () => subtematica ?? deriveAmenazadasSubtematica(tematica, amenazadasCategoria),
    [tematica, subtematica, amenazadasCategoria],
  );
}

export interface DerivedIndicador {
  /** Computed indicator slug (may be null when `useAll` is true). */
  indicador: string | null;
  /** Tematica with hyphens replaced by underscores (API param shape). */
  tematicaSlug: string | null;
  /**
   * True when the chart wants every subcategory for the selected
   * temática (feeds `all_indicators=1` to `/api/sibdata`). Mirrors
   * the switch in `useChartData`:
   *   amenazadas-global / -nacional / cites  → all_indicators
   *   anything else                          → single indicador
   */
  useAll: boolean;
}

/**
 * Central derivation of `(indicador, tematicaSlug, useAll)` from the
 * filter store — the pattern every view needs. Port of the inline
 * block that used to live in `useChartData.ts` and `MapView.tsx`.
 *
 * @param chartType — overrides `state.chartType` for the indicator
 *   calculation. Useful for Map/Municipios which always resolve the
 *   map-style `_total` suffix regardless of which toolbar button is
 *   active.
 */
export function useDerivedIndicador(chartType?: ChartType): DerivedIndicador {
  const tipo = useExploradorStore((s) => s.tipo);
  const tematica = useExploradorStore((s) => s.tematica);
  const amenazadasCategoria = useExploradorStore((s) => s.amenazadasCategoria);
  const storeChartType = useExploradorStore((s) => s.chartType);
  const effectiveSub = useEffectiveSubtematica();

  return useMemo(() => {
    const ct = chartType ?? storeChartType;
    const indicador = calculateIndicador({
      tipo,
      tematica,
      subtematica: effectiveSub,
      amenazadasCategoria,
      chartType: ct,
    });

    const useAll =
      !!tematica &&
      (indicador === null ||
        tematica === "amenazadas-global" ||
        tematica === "amenazadas-nacional" ||
        tematica === "cites");

    return {
      indicador,
      tematicaSlug: tematica ? tematica.replace(/-/g, "_") : null,
      useAll,
    };
  }, [tipo, tematica, amenazadasCategoria, effectiveSub, storeChartType, chartType]);
}
