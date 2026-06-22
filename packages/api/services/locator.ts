import { dirname, fromFileUrl, join } from "https://deno.land/std@0.224.0/path/mod.ts";
import type { Feature } from "npm:@types/geojson@7946.0.14";
import { queryOne } from "../db.ts";
import { renderSvg, type SvgLayer } from "./geo-svg.ts";

// Coarse, locator-specific geometry (built by scripts/build-geo.ts → loc/).
const GEO_DIR = join(dirname(fromFileUrl(import.meta.url)), "..", "static", "geo", "loc");

const BASE: Pick<SvgLayer, "fill" | "stroke" | "strokeWidth"> = {
  fill: "#e5e7eb",
  stroke: "#cbd5e1",
  strokeWidth: 0.3,
};
const HIGHLIGHT: Pick<SvgLayer, "fill" | "stroke" | "strokeWidth"> = {
  fill: "#C2F284", // rgb(194, 242, 132)
  stroke: "#007139",
  strokeWidth: 0.4,
};

const cache = new Map<string, string>();
const silhouetteCache = new Map<string, string>();

// Matches scripts/build-geo.ts:153-157 (SVG_FILL/SVG_STROKE/SVG_SIZE).
const SILHOUETTE = { fill: "#B3CFC0", stroke: "#007139", strokeWidth: 0.5 };

async function loadGeo(slug: string): Promise<Feature[]> {
  try {
    const text = await Deno.readTextFile(join(GEO_DIR, `${slug}.geojson`));
    return (JSON.parse(text).features ?? []) as Feature[];
  } catch (e) {
    if (e instanceof Deno.errors.NotFound) return [];
    throw e;
  }
}

/** Frame = context; one feature (matched by cod_dane) highlighted green. */
function highlightInContext(context: Feature[], codDane: string): string {
  const hit = context.filter((f) => String(f.properties?.cod_dane ?? f.properties?.id) === codDane);
  const rest = context.filter((f) => !hit.includes(f));
  return renderSvg({
    frame: context,
    layers: [{ features: rest, ...BASE }, { features: hit, ...HIGHLIGHT }],
    digits: 1,
  });
}

/** Frame = context (all gray); a separate overlay polygon drawn green on top. */
function overlayOnContext(context: Feature[], overlay: Feature[]): string {
  return renderSvg({
    frame: context,
    layers: [{ features: context, ...BASE }, { features: overlay, ...HIGHLIGHT }],
    digits: 1,
  });
}

/**
 * Render a locator map for a region: the region highlighted (#09A274)
 * within its context. Municipios sit inside their department; departments,
 * núcleos, reservas and resguardos sit inside Colombia. Returns null for an
 * unknown slug. Cached in-memory (geometry is static per deploy).
 */
export async function renderLocator(slug: string): Promise<string | null> {
  if (cache.has(slug)) return cache.get(slug)!;

  let svg: string | null = null;

  const dept = await queryOne(`SELECT cod_dane FROM departamento WHERE slug = $1`, [slug]);
  if (dept?.cod_dane != null) {
    svg = highlightInContext(await loadGeo("colombia"), String(dept.cod_dane));
  } else {
    const muni = await queryOne(`SELECT cod_dane FROM municipio WHERE slug = $1`, [slug]);
    if (muni?.cod_dane != null) {
      const code = String(muni.cod_dane);
      const parent = await queryOne(
        `SELECT slug FROM departamento WHERE cod_dane = $1`,
        [code.slice(0, 2)],
      );
      if (parent?.slug) svg = highlightInContext(await loadGeo(String(parent.slug)), code);
    } else {
      // núcleo / reserva / resguardo / region-amazonia → overlaid on Colombia.
      const overlay = await loadGeo(slug);
      if (overlay.length) svg = overlayOnContext(await loadGeo("colombia"), overlay);
    }
  }

  if (svg) cache.set(slug, svg); // don't cache misses — geometry may appear later
  return svg;
}

/** Standalone region silhouette (no context frame) — replaces the static
 *  packages/web/public/data/<slug>/<slug>.svg. null if no geometry. */
export async function renderSilhouette(slug: string): Promise<string | null> {
  if (silhouetteCache.has(slug)) return silhouetteCache.get(slug)!;
  const features = await loadGeo(slug); // reads static/geo/loc/<slug>.geojson
  if (!features.length) return null;
  const svg = renderSvg({ frame: features, layers: [{ features, ...SILHOUETTE }], size: 144, digits: 2 });
  silhouetteCache.set(slug, svg);
  return svg;
}
