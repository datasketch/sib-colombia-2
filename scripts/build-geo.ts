#!/usr/bin/env -S deno run -A
/**
 * Single-origin cartography build.
 *
 * Reads the ESRI shapefiles in cartography/downloads/ and emits the
 * artifacts the app consumes:
 *   - slug-keyed, PURE-geometry GeoJSON (packages/api/static/geo/) —
 *     counts join live from DuckDB at request time, never baked in.
 *   - per-region SVG silhouettes (packages/web/public/data/<slug>/) —
 *     replacing the legacy R svglite prints.
 *
 * Every shapefile is self-describing: each feature carries slug, label,
 * parent and a DANE code (cod_dane on municipios, dpto_ccdgo on
 * departments). Identity therefore comes from the shapefile, geometry is
 * simplified with mapshaper, and silhouettes are rendered with d3-geo.
 *
 * Tooling: Deno + npm. See cartography/docs/PIPELINE.md.
 */
import * as shapefile from "npm:shapefile@0.6.6";
import mapshaper from "npm:mapshaper@0.6.102";
import type { Feature, FeatureCollection, Geometry, Position } from "npm:@types/geojson@7946.0.14";
import { dirname, fromFileUrl, join } from "https://deno.land/std@0.224.0/path/mod.ts";
import { renderSvg } from "../packages/api/services/geo-svg.ts";

const ROOT = join(dirname(fromFileUrl(import.meta.url)), "..");
const DOWNLOADS = join(ROOT, "cartography", "downloads", "Cartografia_biocifras");
const SEED = join(ROOT, "packages", "db", "data-raw", "db-cifras-sib");
const GEO_OUT = join(ROOT, "packages", "api", "static", "geo");
const SVG_OUT = join(ROOT, "packages", "web", "public", "data");
const SVG_SIZE = 144; // match the legacy svglite viewBox (144x144pt)
const SVG_FILL = "#B3CFC0"; // light sage — visible silhouette on the dark banner (legacy color)
const SVG_STROKE = "#007139"; // green outline (legacy svglite dept stroke)
const SIMPLIFY_PCT = 12; // Visvalingam retention for the choropleth GeoJSON
const SILHOUETTE_PCT = 8; // far coarser — the silhouette only renders at 144px

/**
 * cod_dane → canonical region slug, from the seed tables. The shapefile's
 * own `slug`/`parent` fields are NOT always canonical (e.g. "la guajira"
 * with a space), so admin features are canonicalized by their DANE code.
 */
let CODE_TO_SLUG = new Map<string, string>();
function loadCodeToSlug(): Map<string, string> {
  const m = new Map<string, string>();
  for (const file of ["departamento.tsv", "municipio.tsv"]) {
    const lines = Deno.readTextFileSync(join(SEED, file)).split("\n").slice(1);
    for (const line of lines) {
      if (!line.trim()) continue;
      const [slug, , cod] = line.split("\t"); // cols: slug, label, cod_dane, …
      if (cod?.trim()) m.set(cod.trim(), slug.trim());
    }
  }
  return m;
}

/** Canonical feature properties: pure geometry + slug identity. */
interface GeoProps {
  slug: string;
  label: string;
  cod_dane?: string;
  id?: string; // = cod_dane, kept for legacy readers during transition
}

/** Map a shapefile's .cpg sidecar to a WHATWG encoding label. */
function cpgEncoding(base: string): string {
  try {
    const cpg = Deno.readTextFileSync(`${base}.cpg`).trim().toUpperCase();
    if (cpg.includes("UTF-8") || cpg.includes("UTF8")) return "utf-8";
    if (cpg.includes("1252")) return "windows-1252";
    if (cpg.includes("8859")) return "latin1";
  } catch { /* no .cpg — fall through */ }
  return "utf-8";
}

/** Read a shapefile (.shp + .dbf) into GeoJSON, honoring its .cpg encoding. */
async function readLayer(dir: string, base: string): Promise<FeatureCollection> {
  const path = join(DOWNLOADS, dir, base);
  const fc = await shapefile.read(`${path}.shp`, `${path}.dbf`, { encoding: cpgEncoding(path) });
  return fc as FeatureCollection;
}

function normProps(p: Record<string, unknown>): GeoProps {
  const cod = (p.cod_dane ?? p.dpto_ccdgo) as string | undefined;
  const codStr = cod != null && cod !== "" ? String(cod) : undefined;
  // Admin features → canonical slug by DANE code; specials keep their slug.
  const slug = (codStr && CODE_TO_SLUG.get(codStr)) ?? String(p.slug);
  const out: GeoProps = { slug, label: String(p.label) };
  if (codStr) {
    out.cod_dane = codStr;
    out.id = codStr;
  }
  return out;
}

/** Round every coordinate to `dp` decimals (~1 m at 5dp). */
function roundGeometry(geom: Geometry, dp = 5): Geometry {
  const f = 10 ** dp;
  const round = (n: number) => Math.round(n * f) / f;
  const walk = (c: unknown): unknown =>
    typeof c === "number" ? round(c) : (c as Position[]).map(walk);
  if (geom.type === "GeometryCollection") return geom;
  return { ...geom, coordinates: walk((geom as { coordinates: unknown }).coordinates) } as Geometry;
}

/** Visvalingam-simplify via mapshaper; keep-shapes stops tiny polys collapsing. */
async function simplify(fc: FeatureCollection, pct = SIMPLIFY_PCT): Promise<FeatureCollection> {
  const cmd =
    `-i in.json -simplify visvalingam ${pct}% keep-shapes -clean -o out.json format=geojson`;
  const out = await mapshaper.applyCommands(cmd, { "in.json": JSON.stringify(fc) });
  const raw = out["out.json"];
  return JSON.parse(typeof raw === "string" ? raw : new TextDecoder().decode(raw)) as FeatureCollection;
}

/** Normalize props + simplify a raw shapefile FeatureCollection. */
async function clean(raw: FeatureCollection): Promise<Feature[]> {
  const fc: FeatureCollection = {
    type: "FeatureCollection",
    features: raw.features.map((f) => ({
      type: "Feature",
      geometry: f.geometry,
      properties: normProps(f.properties ?? {}),
    })),
  };
  const simplified = await simplify(fc);
  return simplified.features.map((f) => ({
    type: "Feature",
    properties: f.properties,
    geometry: roundGeometry(f.geometry as Geometry),
  }));
}

async function writeGeojson(slug: string, features: Feature[]) {
  const fc: FeatureCollection = { type: "FeatureCollection", features };
  const path = join(GEO_OUT, `${slug}.geojson`);
  await Deno.writeTextFile(path, JSON.stringify(fc));
  const kb = (await Deno.stat(path)).size / 1024;
  console.log(`  geo  ${slug}.geojson  (${features.length} feat, ${kb.toFixed(0)} KB)`);
}

/**
 * Render a region as an SVG silhouette (filled outline). The silhouette
 * only renders at 144px, so simplify it far harder than the interactive
 * choropleth GeoJSON. Winding/projection live in the shared renderSvg.
 */
async function writeSilhouette(slug: string, geo: Feature | FeatureCollection) {
  const fc: FeatureCollection = geo.type === "FeatureCollection"
    ? geo
    : { type: "FeatureCollection", features: [geo] };
  const small = await simplify(fc, SILHOUETTE_PCT);
  // Persist the coarse geometry for the runtime locator endpoint, which
  // recolours individual features and so needs geometry (not a flat SVG).
  await Deno.mkdir(join(GEO_OUT, "loc"), { recursive: true });
  await Deno.writeTextFile(join(GEO_OUT, "loc", `${slug}.geojson`), JSON.stringify(small));
  const svg = renderSvg({
    frame: small.features,
    layers: [{ features: small.features, fill: SVG_FILL, stroke: SVG_STROKE, strokeWidth: 0.5 }],
    size: SVG_SIZE,
    digits: 2,
  });
  const dir = join(SVG_OUT, slug);
  await Deno.mkdir(dir, { recursive: true });
  await Deno.writeTextFile(join(dir, `${slug}.svg`), svg);
}

// ── Layer builders ──────────────────────────────────────────────────────

/** colombia.geojson (33 depts) + bogota-dc geojson + silhouette (no munis file). */
async function buildColombiaAndDepartments() {
  console.log("\n# Departamentos → colombia + bogota-dc");
  const features = await clean(await readLayer("Departamentos", "colombia"));
  await writeGeojson("colombia", features);
  // Coarse colombia geometry for the locator endpoint (dept/núcleo/reserva
  // highlighted inside the country). Also emits an unused colombia.svg.
  await writeSilhouette("colombia", { type: "FeatureCollection", features });
  // Bogotá D.C. has no Municipios shapefile, so its silhouette is the
  // single department feature (matching the R script's bogota special case).
  const bogota = features.find((f) => (f.properties as GeoProps).slug === "bogota-dc");
  if (bogota) {
    await writeGeojson("bogota-dc", [bogota]);
    await writeSilhouette("bogota-dc", bogota);
  }
}

/**
 * One <dept>.geojson (its municipios) per Municipios/<dept>.shp + the dept
 * silhouette rendered from those municipios — the subdivided map the banner
 * shows (matching scripts/02_departamentos_pais.R's col_municipalities icon).
 */
async function buildMunicipios() {
  console.log("\n# Municipios → per-department geojson + silhouette");
  for await (const entry of Deno.readDir(join(DOWNLOADS, "Municipios"))) {
    if (!entry.name.endsWith(".shp")) continue;
    const base = entry.name.slice(0, -4);
    const raw = await readLayer("Municipios", base);
    const code = String(raw.features[0]?.properties?.dpto_ccdgo ?? "");
    const deptSlug = CODE_TO_SLUG.get(code) ?? base;
    const features = await clean(raw);
    await writeGeojson(deptSlug, features);
    await writeSilhouette(deptSlug, { type: "FeatureCollection", features });
  }
}

/** region-amazonia.geojson (8 constituent departments) + silhouette. */
async function buildAmazonia() {
  console.log("\n# Region Amazonia → region-amazonia");
  const features = await clean(await readLayer("Region Amazonia", "region-amazonia-departamentos"));
  await writeGeojson("region-amazonia", features);
  await writeSilhouette("region-amazonia", { type: "FeatureCollection", features });
}

/** Single-feature special regions: reserva, resguardo. */
async function buildSpecialRegions() {
  console.log("\n# Reserva / Resguardo → single-feature geojson + silhouette");
  const layers: [string, string][] = [
    ["Reserva", "reservas-forestales-protectoras"],
    ["Resguardo", "territorios-indigenas"],
  ];
  for (const [dir, base] of layers) {
    const features = await clean(await readLayer(dir, base));
    for (const feat of features) {
      const slug = (feat.properties as GeoProps).slug;
      await writeGeojson(slug, [feat]);
      await writeSilhouette(slug, feat);
    }
  }
}

/** NDFyB: combined nucleos-dfyb.geojson + one geojson + silhouette per núcleo. */
async function buildNucleos() {
  console.log("\n# NDFyB → núcleos");
  const features = await clean(await readLayer("NDFyB", "nucleos-dfyb"));
  await writeGeojson("nucleos-dfyb", features);
  // Aggregate silhouette + loc/ geometry so /api/locator/nucleos-dfyb.svg
  // renders the country map with all 22 núcleos highlighted.
  await writeSilhouette("nucleos-dfyb", { type: "FeatureCollection", features });
  for (const feat of features) {
    const slug = (feat.properties as GeoProps).slug;
    await writeGeojson(slug, [feat]);
    await writeSilhouette(slug, feat);
  }
}

/** Print each layer's geometry type + attribute keys (design aid). */
async function inspectAll() {
  const layers: [string, string][] = [
    ["Departamentos", "colombia"],
    ["Municipios", "antioquia"],
    ["Region Amazonia", "region-amazonia-departamentos"],
    ["Reserva", "reservas-forestales-protectoras"],
    ["Resguardo", "territorios-indigenas"],
    ["NDFyB", "nucleos-dfyb"],
  ];
  for (const [dir, base] of layers) {
    const fc = await readLayer(dir, base);
    const props = fc.features.map((f) => f.properties ?? {});
    const keys = [...new Set(props.flatMap((p) => Object.keys(p)))];
    console.log(`\n# ${dir}/${base} (${fc.features.length} feat)`);
    console.log(`  keys: ${keys.join(", ")}`);
    console.log(`  row0: ${JSON.stringify(props[0])}`);
  }
}

if (import.meta.main) {
  if (Deno.args.includes("--inspect")) {
    await inspectAll();
  } else {
    CODE_TO_SLUG = loadCodeToSlug();
    await buildColombiaAndDepartments();
    await buildMunicipios();
    await buildAmazonia();
    await buildSpecialRegions();
    await buildNucleos();
    console.log("\n✓ geo build complete");
  }
}
