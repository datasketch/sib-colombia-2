import { ResponsiveTreeMap } from "@nivo/treemap";
import { useExploradorStore } from "../../store";
import { paletteFor } from "../../lib/palettes";
import { useChartData } from "./useChartData";
import { ChartEmpty, ChartError, ChartLoading } from "./ChartState";
import { ChartLegend } from "./ChartLegend";
import { nivoTheme } from "./chart-theme";

export function TreemapView() {
  const tematica = useExploradorStore((s) => s.tematica);
  const { data, isLoading, isError, error, refetch } = useChartData();

  if (isLoading) return <ChartLoading />;
  if (isError) return <ChartError message={error?.message} onRetry={refetch} />;
  if (data.length === 0) return <ChartEmpty />;

  const palette = paletteFor(tematica);

  const root = {
    name: "root",
    children: data.map((d) => ({ name: d.label, value: d.value })),
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0">
        <ResponsiveTreeMap
          theme={nivoTheme}
          data={root}
          identity="name"
          value="value"
          valueFormat={(v) => v.toLocaleString("es-CO")}
          colors={({ id }) => {
            const idx = root.children.findIndex((c) => c.name === id);
            return palette[Math.max(0, idx) % palette.length];
          }}
          colorBy="id"
          // 16 px lets short labels ("CR", "EN", "VU", "I-II") render
          // inside small leaves; the ChartLegend below covers the
          // long ones that still get skipped here.
          labelSkipSize={16}
          label={(node) => `${node.id}`}
          labelTextColor={{ from: "color", modifiers: [["darker", 2.4]] }}
          leavesOnly
          innerPadding={3}
          outerPadding={3}
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
