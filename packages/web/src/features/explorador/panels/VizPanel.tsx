import { useEffect, useMemo, useState } from "react";
import { useExploradorStore } from "../store";
import { availableCharts, pickFallbackChart } from "../lib/available-charts";
import { createBreadcrumb } from "../lib/breadcrumb";
import { ChartSwitcher } from "../components/ChartSwitcher";
import { TipoSelect } from "../components/TipoSelect";
import { ChartContent } from "../components/ChartContent";
import { DataModal } from "../components/DataModal";

export function VizPanel() {
  const region = useExploradorStore((s) => s.region);
  const tematica = useExploradorStore((s) => s.tematica);
  const subtematica = useExploradorStore((s) => s.subtematica);
  const amenazadasCategoria = useExploradorStore((s) => s.amenazadasCategoria);
  const tipo = useExploradorStore((s) => s.tipo);
  const grupo = useExploradorStore((s) => s.grupo);
  const chartType = useExploradorStore((s) => s.chartType);
  const setChartType = useExploradorStore((s) => s.setChartType);

  const available = useMemo(
    () => availableCharts({ tematica, subtematica, amenazadasCategoria }),
    [tematica, subtematica, amenazadasCategoria],
  );

  useEffect(() => {
    if (!available.includes(chartType)) {
      setChartType(pickFallbackChart(available));
    }
  }, [available, chartType, setChartType]);

  const breadcrumb = useMemo(
    () =>
      createBreadcrumb({
        region,
        regionTipo: null,
        grupoTipo: null,
        grupo,
        tematica,
        subtematica,
        amenazadasCategoria,
        tipo,
        chartType,
      }),
    [region, grupo, tematica, subtematica, amenazadasCategoria, tipo, chartType],
  );

  const [dataOpen, setDataOpen] = useState(false);

  const dataButtonLabel: Record<string, string> = {
    map: "Ver datos del mapa",
    cards: "Ver datos de las tarjetas",
  };
  const buttonLabel = dataButtonLabel[chartType] ?? "Ver datos del gráfico";

  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-base mb-2">Visualización</h4>
      <div className="flex items-end justify-between gap-4">
        <ChartSwitcher available={available} />
        <TipoSelect />
      </div>
      <h3 className="font-semibold text-base min-h-[1.5em]">{breadcrumb}</h3>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setDataOpen(true)}
          className="text-xs border border-gray-300 rounded px-2 py-1 hover:bg-gray-50 whitespace-nowrap"
        >
          {buttonLabel}
        </button>
      </div>
      <ChartContent />
      <DataModal open={dataOpen} onClose={() => setDataOpen(false)} />
    </div>
  );
}
