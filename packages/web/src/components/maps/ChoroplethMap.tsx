import { useEffect, useState } from "react";
import { MapContainer, GeoJSON, TileLayer, useMap } from "react-leaflet";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { Layer, PathOptions } from "leaflet";
import "leaflet/dist/leaflet.css";
import { formatNumber } from "../../lib/format";

interface Props {
  /** GeoJSON URL — usually /static/geo/{slug}.geojson */
  geojsonUrl: string;
  /** Which property to display: especies or registros */
  metric?: "especies" | "registros";
  /** Path prefix for clicking features (e.g., /colombia/) */
  linkPrefix?: string;
  height?: number;
}

/**
 * Interactive choropleth map using react-leaflet.
 * Reads n_especies / n_registros directly from GeoJSON feature properties.
 */
export function ChoroplethMap({
  geojsonUrl,
  metric = "especies",
  linkPrefix,
  height = 500,
}: Props) {
  const [geojson, setGeojson] = useState<FeatureCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(geojsonUrl)
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
        return r.json();
      })
      .then((data) => {
        if (!cancelled) {
          setGeojson(data);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(String(e));
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [geojsonUrl]);

  if (loading) {
    return (
      <div className="flex items-center justify-center bg-gray-50 rounded" style={{ height }}>
        <p className="text-gray-500">Cargando mapa...</p>
      </div>
    );
  }
  if (error || !geojson) {
    return (
      <div className="flex items-center justify-center bg-gray-50 rounded text-sm text-gray-500" style={{ height }}>
        Mapa no disponible
      </div>
    );
  }

  const propKey = metric === "especies" ? "n_especies" : "n_registros";
  const values = geojson.features
    .map((f) => Number(f.properties?.[propKey] ?? 0))
    .filter((v) => v > 0);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);

  const getColor = (value: number): string => {
    if (max === min) return "#a8ddb5";
    const t = (value - min) / (max - min);
    const colors = ["#edf8e9", "#bae4b3", "#74c476", "#31a354", "#006d2c"];
    const idx = Math.min(Math.floor(t * colors.length), colors.length - 1);
    return colors[idx];
  };

  const styleFeature = (feature?: Feature<Geometry>): PathOptions => {
    const value = Number(feature?.properties?.[propKey] ?? 0);
    return {
      fillColor: value > 0 ? getColor(value) : "#e5e7eb",
      weight: 1,
      color: "#444",
      fillOpacity: 0.85,
    };
  };

  const onEachFeature = (feature: Feature<Geometry>, layer: Layer) => {
    const props = feature.properties ?? {};
    const label = props.label ?? props.name ?? "";
    const especies = Number(props.n_especies ?? 0);
    const registros = Number(props.n_registros ?? 0);
    const id = props.id ?? props.cod_dane ?? props.slug;
    const popup = `
      <strong>${label}</strong><br/>
      ${formatNumber(especies)} especies<br/>
      ${formatNumber(registros)} registros
      ${linkPrefix && id ? `<br/><a href="${linkPrefix}${String(id).toLowerCase()}" class="text-lemon underline">Ver más</a>` : ""}
    `;
    layer.bindPopup(popup);
  };

  return (
    <div className="rounded overflow-hidden shadow-default" style={{ height }}>
      <MapContainer
        center={[4.5, -74]}
        zoom={5}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <GeoJSON data={geojson} style={styleFeature} onEachFeature={onEachFeature} />
        <FitBounds geojson={geojson} />
      </MapContainer>
    </div>
  );
}

function FitBounds({ geojson }: { geojson: FeatureCollection }) {
  const map = useMap();
  useEffect(() => {
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled) return;
      const tmpLayer = L.geoJSON(geojson);
      const bounds = tmpLayer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [geojson, map]);
  return null;
}
