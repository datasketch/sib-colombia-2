import { useMemo } from "react";
import { useExploradorStore } from "../../store";
import { useLabels, useSibdata } from "../../api";
import { useDerivedIndicador } from "../../lib/use-derived";
import type { SibdataRow } from "../../types";

export interface ChartDatum {
  id: string;
  label: string;
  /** true when `label` is the raw slug because `/api/labels` hasn't resolved. */
  labelIsRaw: boolean;
  value: number;
  indicador: string;
}

/**
 * Shared data fetcher for the Nivo chart views (pie, donut, bar, treemap).
 * Returns one datum per indicator when `all_indicators=true` is applicable,
 * otherwise one datum for the single computed indicator.
 *
 * Parity: mirrors the `output$hgch_viz` block in app4.R:616-671, minus
 * the highcharter-specific render call.
 */
export function useChartData(): {
  data: ChartDatum[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  raw: SibdataRow[];
  refetch: () => void;
} {
  const region = useExploradorStore((s) => s.region);
  const tipo = useExploradorStore((s) => s.tipo);
  const grupo = useExploradorStore((s) => s.grupo);
  const { indicador, tematicaSlug, useAll } = useDerivedIndicador();

  const q = useSibdata(
    region
      ? {
          region,
          tipo,
          tematica: tematicaSlug,
          indicador: useAll ? null : indicador,
          grupo,
          subregiones: false,
          all_indicators: useAll,
        }
      : null,
  );

  const raw = q.data ?? [];
  const slugs = useMemo(() => {
    const s = new Set<string>();
    for (const r of raw) s.add(r.indicador);
    return [...s];
  }, [raw]);
  const labels = useLabels(slugs);

  const data: ChartDatum[] = useMemo(() => {
    // Drop ambiente variants (spec §12.6) and null-count rows
    // ("no data" — distinct from zero; rendering zero would mislead).
    const filtered = raw.filter(
      (r): r is SibdataRow & { count: number } =>
        !/marinas|continentales|salobres/.test(r.indicador) &&
        typeof r.count === "number",
    );
    // Keep only the active tipo unless amenazadas _total wants both
    // (rare case — charts should be mono-tipo in practice).
    const tipoMatched = filtered.filter((r) =>
      tipo === "registros"
        ? r.indicador.startsWith("registros_")
        : r.indicador.startsWith("especies_"),
    );
    const source = tipoMatched.length > 0 ? tipoMatched : filtered;

    return source.map((r) => {
      // Raw slug is used as the label while `/api/labels` is pending;
      // flagged via `labelIsRaw` so the chart view can surface the gap
      // (monospace, muted, or a loader) rather than showing it silently.
      const resolved = labels.data?.[r.indicador];
      const lbl = resolved ?? r.indicador;
      return {
        id: r.indicador,
        label: lbl.replace(/registros/gi, "Observaciones"),
        labelIsRaw: resolved === undefined,
        value: r.count,
        indicador: r.indicador,
      };
    });
  }, [raw, labels.data, tipo]);

  return {
    data,
    isLoading: q.isLoading,
    isError: q.isError,
    error: (q.error as Error | null) ?? null,
    raw,
    refetch: () => void q.refetch(),
  };
}
