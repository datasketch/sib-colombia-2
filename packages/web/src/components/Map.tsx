import { useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";

interface CountryRanking {
  puesto: number;
  pais: string;
  "..gt_id": string;
  "..gt_name": string;
  "..gt_map_name": string;
  lat?: number;
  lon?: number;
}

interface Props {
  details: CountryRanking[];
}

const COLOR_SCALE: Record<number, string> = {
  1: "#ff2c00",
  2: "#ff540f",
  3: "#ff6f1f",
  4: "#ff852f",
  5: "#ff9a40",
  6: "#ffad52",
  7: "#ffbe67",
  8: "#ffcf80",
  9: "#ffdf9f",
  10: "#ffeec9",
};
const DEFAULT_COLOR = "#515B6A";

function selectColorRanking(position?: number): string {
  if (!position) return DEFAULT_COLOR;
  return COLOR_SCALE[position] ?? DEFAULT_COLOR;
}

interface HoverState {
  pais: string;
  position: string;
  x?: number;
  y?: number;
}

/**
 * Equal-Earth world map with countries colored by ranking position.
 * Port of Map.jsx (react-simple-maps).
 */
export function Map({ details }: Props) {
  const [hovered, setHovered] = useState<HoverState>({ pais: "", position: "" });

  const colorSelector = (name: string): string => {
    const found = details?.find((d) => d["..gt_name"] === name);
    return selectColorRanking(found?.puesto);
  };

  const onEnter = (name: string, evt: React.MouseEvent) => {
    const found = details?.find((d) => d["..gt_name"] === name);
    if (!found) {
      setHovered({ pais: "", position: "" });
      return;
    }
    setHovered({
      pais: found.pais,
      position: String(found.puesto),
      x: evt.clientX,
      y: evt.clientY,
    });
  };

  const onLeave = () => setHovered({ pais: "", position: "" });

  return (
    <div className="relative">
      <ComposableMap projection="geoEqualEarth">
        <Geographies geography="/maps.json">
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                stroke="#333333"
                strokeWidth={0.5}
                onMouseEnter={(e) => onEnter(geo.properties.name, e)}
                onMouseLeave={onLeave}
                style={{
                  default: {
                    fill: colorSelector(geo.properties.name),
                    outline: "none",
                  },
                  hover: {
                    fill: "#628bf8",
                    outline: "none",
                    cursor: "pointer",
                  },
                  pressed: { outline: "none", fill: "none" },
                }}
              />
            ))
          }
        </Geographies>
      </ComposableMap>
      {hovered.pais && hovered.x !== undefined && (
        <div
          className="fixed pointer-events-none bg-white text-black text-xs p-2 rounded shadow-lg z-50"
          style={{ top: hovered.y, left: hovered.x + 12 }}
        >
          <p className="font-bold">{hovered.pais}</p>
          <p className="italic">Puesto {hovered.position}</p>
        </div>
      )}
    </div>
  );
}
