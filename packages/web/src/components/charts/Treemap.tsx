import { ResponsiveContainer, Treemap as RechartsTreemap, Tooltip } from "recharts";

interface TreemapItem {
  name: string;
  size: number;
}

interface Props {
  data: TreemapItem[];
  height?: number;
}

const COLORS = [
  "#00634B", "#09A274", "#4AD3AC", "#C2F284",
  "#5151F2", "#4B3CB4", "#0090FF", "#0857C9",
  "#E1501B", "#FFB349", "#FFD150", "#F26330",
];

/**
 * Treemap visualization for hierarchical data (e.g., subgrupos within a grupo).
 */
export function Treemap({ data, height = 300 }: Props) {
  if (!data || data.length === 0) return null;

  const formatted = data
    .filter((d) => d.size > 0)
    .sort((a, b) => b.size - a.size)
    .map((d, i) => ({
      ...d,
      fill: COLORS[i % COLORS.length],
    }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsTreemap
        data={formatted}
        dataKey="size"
        stroke="#fff"
        fill="#09A274"
        content={<CustomCell />}
      >
        <Tooltip
          formatter={(value: number) => [value.toLocaleString("es-CO"), "Especies"]}
        />
      </RechartsTreemap>
    </ResponsiveContainer>
  );
}

interface CellProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  size?: number;
  fill?: string;
}

function CustomCell(props: CellProps) {
  const { x = 0, y = 0, width = 0, height = 0, name = "", size = 0, fill = "#09A274" } = props;
  if (width < 4 || height < 4) return null;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={fill} stroke="#fff" />
      {width > 60 && height > 30 && (
        <>
          <text
            x={x + 6}
            y={y + 18}
            fill="#fff"
            fontSize={12}
            fontWeight="600"
          >
            {name}
          </text>
          <text x={x + 6} y={y + 32} fill="#fff" fontSize={11} opacity={0.85}>
            {size.toLocaleString("es-CO")}
          </text>
        </>
      )}
    </g>
  );
}
