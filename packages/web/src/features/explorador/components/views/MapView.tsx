import { useEffect, useMemo, useState } from "react";
import { GeoJSON, MapContainer, useMap } from "react-leaflet";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import L from "leaflet";
import type { Layer, PathOptions } from "leaflet";
import { scaleLinear } from "d3-scale";
import "leaflet/dist/leaflet.css";
import { useExploradorStore } from "../../store";
import { useSibdata } from "../../api";
import { useDerivedIndicador } from "../../lib/use-derived";
import { mapPaletteFor } from "../../lib/palettes";
import type { SibdataRow } from "../../types";
import { ChartError } from "./ChartState";

type CountLookup = Map<string, { label: string; count: number }>;

/**
 * Index sibdata rows by `cod_dane` (primary join key per spec §4.1) and
 * `slug_region`. Null-count rows are dropped upstream — if the API
 * doesn't return `cod_dane`, features stay uncolored so the gap is
 * visible (no silent normalization).
 */
function buildLookup(
  rows: Array<Pick<SibdataRow, "cod_dane" | "slug_region" | "label_region"> & { count: number }>,
): CountLookup {
  const m = new Map<string, { label: string; count: number }>();
  for (const r of rows) {
    const entry = { label: r.label_region, count: r.count };
    if (r.cod_dane) m.set(String(r.cod_dane), entry);
    if (r.slug_region) m.set(r.slug_region, entry);
  }
  return m;
}

function findInLookup(
  feature: Feature<Geometry>,
  lookup: CountLookup,
): { label: string; count: number } | undefined {
  const p = feature.properties ?? {};
  // Spec §4.1: cod_dane is the primary join key; id is the GeoJSON
  // convention (same value on department/municipio features); slug
  // is a last-resort fallback for hand-authored feature sets.
  const candidates: (string | undefined)[] = [
    p.cod_dane as string | undefined,
    p.id as string | undefined,
    p.slug as string | undefined,
  ];
  for (const k of candidates) {
    if (!k) continue;
    const hit = lookup.get(String(k));
    if (hit) return hit;
  }
  return undefined;
}

function featureLabel(feature: Feature<Geometry>): string {
  const p = feature.properties ?? {};
  const raw = (p.label as string | undefined) ?? (p.name as string | undefined) ?? "";
  // Per spec §12.5 — force label "BOGOTÁ" for that region.
  if (raw.toUpperCase() === "BOGOTÁ DC" || raw.toUpperCase() === "BOGOTA DC") return "BOGOTÁ";
  return raw;
}

function FitBounds({ geojson }: { geojson: FeatureCollection }) {
  const map = useMap();
  useEffect(() => {
    const tmp = L.geoJSON(geojson);
    const bounds = tmp.getBounds();
    // animate:false suppresses the default 250ms zoom tween — the user
    // wants the map to land on the right extent immediately on load.
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [20, 20], animate: false });
  }, [geojson, map]);
  return null;
}

export function MapView() {
  const region = useExploradorStore((s) => s.region);
  const tipo = useExploradorStore((s) => s.tipo);
  const grupo = useExploradorStore((s) => s.grupo);
  // Map always resolves indicators with `chartType: "map"` regardless of
  // which toolbar button is currently active (so subtematica_total etc.
  // land on the correct `_total` suffix).
  const { indicador, tematicaSlug } = useDerivedIndicador("map");

  const q = useSibdata(
    region
      ? {
          region,
          tipo,
          tematica: tematicaSlug,
          indicador,
          grupo,
          subregiones: true,
        }
      : null,
  );

  // Fetch GeoJSON for the current region.
  const [geojson, setGeojson] = useState<FeatureCollection | null>(null);
  const [geoErr, setGeoErr] = useState(false);
  const [geoNonce, setGeoNonce] = useState(0);
  useEffect(() => {
    if (!region) return;
    setGeojson(null);
    setGeoErr(false);
    let cancelled = false;
    fetch(`/static/geo/${region}.geojson`)
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
        return r.json();
      })
      .then((data) => !cancelled && setGeojson(data))
      .catch(() => !cancelled && setGeoErr(true));
    return () => {
      cancelled = true;
    };
  }, [region, geoNonce]);

  // Drop null-count rows upstream — they're "no data" (distinct from
  // zero). Uncolored features are the correct visual signal.
  const rowsWithCount = useMemo(
    () =>
      (q.data ?? []).filter(
        (r): r is SibdataRow & { count: number } => typeof r.count === "number",
      ),
    [q.data],
  );

  const lookup = useMemo(() => buildLookup(rowsWithCount), [rowsWithCount]);

  const [pale, deep] = mapPaletteFor(indicador);
  const values = useMemo(
    () => rowsWithCount.map((r) => r.count).filter((v) => v > 0),
    [rowsWithCount],
  );
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 1;

  // d3-scale with reversed domain so higher values → deep color.
  // Port of the "value * -1" trick in R/map.R:168-171.
  const colorScale = useMemo(
    () => scaleLinear<string>().domain([max, min]).range([pale, deep]).clamp(true),
    [min, max, pale, deep],
  );

  const styleFeature = (feature?: Feature<Geometry>): PathOptions => {
    if (!feature) return { fillColor: "#e5e7eb", weight: 1, color: "#444", fillOpacity: 0.6 };
    const hit = findInLookup(feature, lookup);
    // null or missing → uncolored (distinct signal from zero).
    const value = hit?.count;
    return {
      fillColor: typeof value === "number" && value > 0 ? colorScale(value) : "#e5e7eb",
      weight: 1,
      color: "#444",
      fillOpacity: 0.85,
    };
  };

  const onEachFeature = (feature: Feature<Geometry>, layer: Layer) => {
    const label = featureLabel(feature);
    const hit = findInLookup(feature, lookup);
    const metric = tipo === "registros" ? "Observaciones" : "Especies";
    const valueText =
      typeof hit?.count === "number" ? hit.count.toLocaleString("es-CO") : "Sin datos";
    const popup = `<strong>${label}</strong><br/>${metric}: ${valueText}`;
    layer.bindPopup(popup);
  };

  if (q.isError) {
    return <ChartError message={(q.error as Error | null)?.message} onRetry={() => void q.refetch()} />;
  }
  if (geoErr) {
    return (
      <ChartError
        message={`No se pudo cargar /static/geo/${region}.geojson`}
        onRetry={() => {
          setGeoErr(false);
          setGeoNonce((n) => n + 1);
        }}
      />
    );
  }

  // Title for the legend mirrors the R `choropleth_map()` block at
  // map.R:174-185 — sib_merge_ind_label() gives a human label and
  // "registros" is replaced with "Observaciones".
  const legendTitle =
    indicador && /especies/.test(indicador)
      ? "Total de Especies"
      : "Total de Observaciones";

  return (
    // `isolate` creates a stacking context so leaflet's pane z-indexes
    // (popups at 700, tooltips at 800) stay scoped to the map column —
    // otherwise they bleed past the panel border and overlap the species
    // table on the right when the explorer is opened from a region's
    // "Explorar especies" deep link (upstream #3).
    <div className="relative isolate h-full w-full rounded overflow-hidden border border-gray-200 bg-white">
      <MapContainer
        center={[4.5, -74]}
        zoom={5}
        scrollWheelZoom={false}
        zoomControl
        style={{ height: "100%", width: "100%", background: "#ffffff" }}
      >
        {geojson && (
          <>
            <GeoJSON
              key={`${region}-${indicador ?? "noind"}`}
              data={geojson}
              style={styleFeature}
              onEachFeature={onEachFeature}
            />
            <FitBounds geojson={geojson} />
          </>
        )}
      </MapContainer>
      {rowsWithCount.length > 0 && (
        <Legend title={legendTitle} pale={pale} deep={deep} min={min} max={max} />
      )}
    </div>
  );
}

/**
 * Vertical bin legend that matches `leaflet::addLegend(... bins=5,
 * position="bottomright")` in R/map.R:219-231.
 */
function Legend({
  title,
  pale,
  deep,
  min,
  max,
}: {
  title: string;
  pale: string;
  deep: string;
  min: number;
  max: number;
}) {
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= 0) return null;

  // 5 evenly spaced bins from min to max (descending — highest at top).
  const bins = 5;
  const stops: { value: number; color: string }[] = [];
  for (let i = bins - 1; i >= 0; i--) {
    const t = i / (bins - 1);
    const value = min + (max - min) * t;
    // Linear interpolation in hex space — cheap match to scaleLinear.
    const color = lerpHex(pale, deep, t);
    stops.push({ value, color });
  }

  return (
    <div className="absolute bottom-4 right-4 bg-white/95 border border-gray-200 rounded shadow-sm px-3 py-2 text-xs z-[1000]">
      <div className="font-semibold mb-1">{title}</div>
      <div className="space-y-1">
        {stops.map((s, i) => (
          <div key={i} className="flex items-center gap-2 tabular-nums">
            <span
              className="inline-block w-4 h-3 border border-white"
              style={{ background: s.color }}
            />
            <span>{Math.round(s.value).toLocaleString("es-CO")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function lerpHex(a: string, b: string, t: number): string {
  const pa = hexToRgb(a);
  const pb = hexToRgb(b);
  const r = Math.round(pa[0] + (pb[0] - pa[0]) * t);
  const g = Math.round(pa[1] + (pb[1] - pa[1]) * t);
  const bl = Math.round(pa[2] + (pb[2] - pa[2]) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

function hexToRgb(h: string): [number, number, number] {
  const s = h.replace("#", "");
  const v = s.length === 3 ? s.split("").map((c) => c + c).join("") : s;
  return [
    parseInt(v.slice(0, 2), 16),
    parseInt(v.slice(2, 4), 16),
    parseInt(v.slice(4, 6), 16),
  ];
}
