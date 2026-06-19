interface Props {
  /** [colombia/parent, region] both with especies_region_total */
  data: { slug_region: string; especies_region_total: number }[];
}

/**
 * 10x10 grid of dots representing the proportion of region species vs parent.
 * Filled dots use orange (#F26330), unfilled use purple (#5151F2).
 * Bottom-up fill order via flex-wrap-reverse.
 * Port of WaffleChart.jsx (D3 version, but D3-free implementation).
 */
export function WaffleChart({ data }: Props) {
  if (!data || data.length < 2) return null;

  const total = data[0]?.especies_region_total ?? 100;
  const part = data[1]?.especies_region_total ?? 0;
  const percentage = total > 0 ? Math.round((part / total) * 100) : 0;

  return (
    <div className="flex justify-center items-center">
      <div className="flex flex-wrap-reverse" style={{ width: "240px" }}>
        {Array.from({ length: 100 }, (_, i) => (
          <span
            key={i}
            style={{
              backgroundColor: i < percentage ? "#F26330" : "#5151F2",
              width: "20px",
              height: "20px",
              margin: "2px",
              borderRadius: "9999px",
              display: "inline-block",
            }}
          />
        ))}
      </div>
    </div>
  );
}
