import { dirname, fromFileUrl, join } from "https://deno.land/std@0.224.0/path/mod.ts";
import { querySubregionTematica } from "./sibdata-queries.ts";

const __dirname = dirname(fromFileUrl(import.meta.url));
const GEO_DIR = join(__dirname, "..", "static", "geo");

interface GeoFeature {
  type: "Feature";
  properties: Record<string, unknown>;
  geometry: Record<string, unknown>;
}

interface GeoJSON {
  type: "FeatureCollection";
  features: GeoFeature[];
}

interface MapDataItem {
  id: string;
  label: string;
  n_especies: number | null;
  n_registros: number | null;
  geom: Record<string, unknown>;
}

const cache = new Map<string, MapDataItem[]>();

/**
 * Build the legacy `territorio[0].map_data` shape for a region's map:
 *   [{ id, label, n_especies, n_registros, geom }, ...]
 *
 * Geometry comes from the slug-keyed, PURE-geometry GeoJSON produced by
 * `scripts/build-geo.ts`. Counts are joined LIVE from `region_tematica`
 * (via querySubregionTematica) by cod_dane/slug — never read from the
 * GeoJSON, so the map always reflects the current data cut. A subregion
 * with no count row stays `null` ("no data", distinct from zero) rather
 * than being silently coerced to 0.
 *
 * Returns [] only when the region has no geometry file (e.g. an abstract
 * category parent) — every other error propagates.
 */
export async function getMapData(slug: string): Promise<MapDataItem[]> {
  if (cache.has(slug)) return cache.get(slug)!;

  let geo: GeoJSON;
  try {
    geo = JSON.parse(await Deno.readTextFile(join(GEO_DIR, `${slug}.geojson`)));
  } catch (e) {
    if (e instanceof Deno.errors.NotFound) {
      cache.set(slug, []);
      return [];
    }
    throw e;
  }
  if (!geo.features) {
    cache.set(slug, []);
    return [];
  }

  // Live per-subregion counts, indexed by both join keys the geometry
  // might carry (cod_dane for admin regions, slug for special regions).
  const rows = await querySubregionTematica(slug);
  const num = (v: unknown) => (v == null ? null : Number(v));
  const byKey = new Map<string, { especies: number | null; registros: number | null; label: string | null }>();
  for (const r of rows) {
    const rec = {
      especies: num(r.especies_region_total),
      registros: num(r.registros_region_total),
      label: (r.label_region ?? r.label ?? null) as string | null,
    };
    if (r.cod_dane != null) byKey.set(String(r.cod_dane), rec);
    if (r.slug_region != null) byKey.set(String(r.slug_region), rec);
  }

  const items: MapDataItem[] = geo.features.map((f) => {
    const p = f.properties ?? {};
    const key = String(p.cod_dane ?? p.id ?? p.slug ?? "");
    const c = byKey.get(key);
    return {
      id: key,
      label: String(p.label ?? c?.label ?? ""),
      n_especies: c?.especies ?? null,
      n_registros: c?.registros ?? null,
      geom: f.geometry,
    };
  });
  cache.set(slug, items);
  return items;
}
