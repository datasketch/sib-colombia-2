import { ResponsiveBar } from "@nivo/bar";
import { useExploradorStore } from "../../store";
import { paletteFor } from "../../lib/palettes";
import { useChartData } from "./useChartData";
import { ChartEmpty, ChartError, ChartLoading } from "./ChartState";
import { ChartLegend } from "./ChartLegend";
import { nivoTheme } from "./chart-theme";

export function BarView() {
  const tematica = useExploradorStore((s) => s.tematica);
  const { data, isLoading, isError, error, refetch } = useChartData();

  if (isLoading) return <ChartLoading />;
  if (isError) return <ChartError message={error?.message} onRetry={refetch} />;
  if (data.length === 0) return <ChartEmpty />;

  const palette = paletteFor(tematica);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0">
        <ResponsiveBar
          theme={nivoTheme}
          data={data.map((d) => ({ label: d.label, value: d.value }))}
          keys={["value"]}
          indexBy="label"
          layout="vertical"
          colors={({ index }) => palette[index % palette.length]}
          colorBy="indexValue"
          enableLabel={false}
          axisBottom={null}
          axisLeft={{
            legend: "",
            format: (v) => (typeof v === "number" ? v.toLocaleString("es-CO") : String(v)),
          }}
          margin={{ top: 16, right: 20, bottom: 12, left: 60 }}
          padding={0.3}
          valueFormat={(v) => v.toLocaleString("es-CO")}
          tooltip={({ indexValue, value }) => (
            <div className="bg-white border border-gray-200 rounded px-2 py-1 text-xs shadow">
              <strong>{indexValue}</strong>: {value.toLocaleString("es-CO")}
            </div>
          )}
        />
      </div>
      <ChartLegend
        items={data.map((d, i) => ({
          label: d.label,
          color: palette[i % palette.length],
          value: d.value,
        }))}
      />
    </div>
  );
}
