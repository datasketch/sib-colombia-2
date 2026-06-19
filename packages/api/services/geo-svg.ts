import { geoMercator, geoPath } from "npm:d3-geo@3";
import type { Feature, FeatureCollection, Geometry, Position } from "npm:@types/geojson@7946.0.14";

/** Shoelace signed area; >0 = counter-clockwise. */
function ringArea(ring: Position[]): number {
  let a = 0;
  for (let i = 0, n = ring.length; i < n; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[(i + 1) % n];
    a += x1 * y2 - x2 * y1;
  }
  return a / 2;
}

/**
 * Rewind a geometry's rings to CW-exterior / CCW-holes IN PLACE. d3-geo's
 * spherical path treats CCW-exterior rings (the shapefile / RFC-7946
 * winding) as the polygon's COMPLEMENT — filling the whole viewBox and
 * punching the real shape out as a hole. Leaflet is planar and ignores
 * winding, so this is applied only when rendering SVG.
 */
function rewindGeometry(geom: Geometry): void {
  const fixPoly = (rings: Position[][]) =>
    rings.forEach((ring, i) => {
      const ccw = ringArea(ring) > 0;
      if ((i === 0) === ccw) ring.reverse(); // exterior CW, holes CCW
    });
  if (geom.type === "Polygon") fixPoly(geom.coordinates);
  else if (geom.type === "MultiPolygon") geom.coordinates.forEach(fixPoly);
}

export interface SvgLayer {
  features: Feature[];
  fill: string;
  stroke?: string;
  strokeWidth?: number;
}

/**
 * Project features with a Mercator fit-to-box and render layered SVG paths.
 * `frame` features set the viewBox extent (fitSize); `layers` are drawn in
 * order (later on top). Each unique feature is rewound exactly once.
 */
export function renderSvg(opts: {
  frame: Feature[];
  layers: SvgLayer[];
  size?: number;
  digits?: number;
}): string {
  const size = opts.size ?? 144;

  // Rewind every unique feature once (frame + layers may share objects).
  const seen = new Set<Feature>();
  for (const f of [...opts.frame, ...opts.layers.flatMap((l) => l.features)]) {
    if (!seen.has(f)) {
      seen.add(f);
      rewindGeometry(f.geometry as Geometry);
    }
  }

  const frameFc = { type: "FeatureCollection", features: opts.frame } as FeatureCollection;
  // deno-lint-ignore no-explicit-any
  const projection = geoMercator().fitSize([size, size], frameFc as any);
  const path = geoPath(projection);
  if (opts.digits != null) path.digits?.(opts.digits);

  const body = opts.layers.map((layer) => {
    const fc = { type: "FeatureCollection", features: layer.features } as FeatureCollection;
    // deno-lint-ignore no-explicit-any
    const d = path(fc as any);
    if (!d) return "";
    const stroke = layer.stroke ?? "#007139";
    const sw = layer.strokeWidth ?? 0.3;
    return `<path d="${d}" fill="${layer.fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" ` +
    `viewBox="0 0 ${size} ${size}">${body}</svg>`;
}
