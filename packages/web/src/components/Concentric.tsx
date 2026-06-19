interface Props {
  inner: number;
  outer: number;
  /** Smaller version for mobile */
  small?: boolean;
}

/**
 * Two concentric circles representing observed (inner) vs estimated (outer) species.
 * Port of sib-colombia/components/Concentric.jsx — area-proportional with sqrt scaling.
 */
export function Concentric({ inner, outer, small = false }: Props) {
  // Original used d3 scaleLinear over a "radius" constant of 25000 (or 15000 mobile),
  // then took sqrt() of the result. We replicate that exactly.
  const radius = small ? 15000 : 25000;
  const outerSize = Math.sqrt(radius);
  const innerScaledArea = outer > 0 ? (inner / outer) * radius : 0;
  const innerSize = Math.sqrt(innerScaledArea);

  return (
    <div
      className="relative"
      style={{
        width: `${outerSize}px`,
        height: `${outerSize}px`,
        borderRadius: "50%",
        border: "1px solid white",
      }}
    >
      <div
        style={{
          width: `${innerSize}px`,
          height: `${innerSize}px`,
          borderRadius: "50%",
          border: "1px solid white",
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          backgroundColor: "#C2F284",
        }}
      />
    </div>
  );
}
