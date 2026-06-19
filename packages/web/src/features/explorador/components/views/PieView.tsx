import { ResponsivePie } from "@nivo/pie";
import { useExploradorStore } from "../../store";
import { paletteFor } from "../../lib/palettes";
import { useChartData } from "./useChartData";
import { ChartEmpty, ChartError, ChartLoading } from "./ChartState";
import { ChartLegend } from "./ChartLegend";
import { nivoTheme } from "./chart-theme";

interface Props {
  innerRadius?: number;
}

export function PieView({ innerRadius = 0 }: Props) {
  const tematica = useExploradorStore((s) => s.tematica);
  const { data, isLoading, isError, error, refetch } = useChartData();

  if (isLoading) return <ChartLoading />;
  if (isError) return <ChartError message={error?.message} onRetry={refetch} />;
  if (data.length === 0) return <ChartEmpty />;

  const palette = paletteFor(tematica);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0">
        <ResponsivePie
          theme={nivoTheme}
          data={data}
          innerRadius={innerRadius}
          padAngle={0.5}
          cornerRadius={2}
          enableArcLabels={false}
          enableArcLinkLabels={false}
          colors={palette}
          margin={{ top: 16, right: 16, bottom: 16, left: 16 }}
          valueFormat={(v) => v.toLocaleString("es-CO")}
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
