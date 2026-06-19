import { Hono } from "hono";
import { dirname, fromFileUrl, join } from "https://deno.land/std@0.224.0/path/mod.ts";
import { queryOne, queryRows } from "../db.ts";
import { getPersistedShapeReport } from "../services/shape-drift.ts";
import { isProduction } from "../env.ts";

const __dirname = dirname(fromFileUrl(import.meta.url));
const STATIC_HOME_PATH = join(__dirname, "..", "static", "home.json");

const DESTACADOS_SLUGS = [
  "amazonas",
  "caqueta",
  "cauca",
  "guainia",
  "guaviare",
  "meta",
  "putumayo",
  "vaupes",
  "region-amazonia",
];

interface RegionTotals {
  slug_region: string;
  label_region: string;
  observadas: number;
  especies_estimadas: number;
  especies_total: number;
}

async function loadRegionTotals(slug: string): Promise<RegionTotals> {
  const row = await queryOne(
    `SELECT r.slug AS slug_region, r.label AS label_region,
            rt.registros_region_total AS observadas,
            rt.especies_region_estimadas AS especies_estimadas,
            rt.especies_region_total AS especies_total
     FROM region r
     LEFT JOIN region_tematica rt ON r.slug = rt.slug_region
     WHERE r.slug = $1`,
    [slug],
  );
  if (!row) throw new Error(`Region not found: ${slug}`);
  return {
    slug_region: String(row.slug_region),
    label_region: String(row.label_region),
    observadas: Number(row.observadas),
    especies_estimadas: Number(row.especies_estimadas),
    especies_total: Number(row.especies_total),
  };
}

async function loadStaticHome(): Promise<Record<string, unknown>> {
  const content = await Deno.readTextFile(STATIC_HOME_PATH);
  return JSON.parse(content);
}

const home = new Hono();

/**
 * GET /api/home
 *
 * Default: computes live totals from DuckDB for Colombia and the 9 destacadas
 * regions. Editorial `lista_mapa` (country ranking + position refs) is loaded
 * from the frozen static/home.json because there is no DuckDB source for it
 * yet — if that file is missing, the endpoint fails rather than falling back.
 *
 * ?static=1 — serve the frozen static/home.json verbatim (for shape diffing
 *             and to compare legacy vs. live values).
 */
home.get("/", async (c) => {
  const serveStatic = c.req.query("static") === "1";

  if (serveStatic) {
    if (isProduction()) {
      return c.json(
        { error: "Static snapshots are disabled in production (SIBDATA_ENV=production)." },
        404,
      );
    }
    const content = await Deno.readTextFile(STATIC_HOME_PATH);
    return c.body(content, 200, { "content-type": "application/json" });
  }

  const staticHome = await loadStaticHome();
  const lista_mapa = staticHome.lista_mapa;
  if (!lista_mapa) {
    throw new Error("static/home.json is missing lista_mapa");
  }

  const [colombia, destacados] = await Promise.all([
    loadRegionTotals("colombia"),
    Promise.all(DESTACADOS_SLUGS.map(loadRegionTotals)),
  ]);

  // Override specific labels to match sib-colombia conventions.
  const labelOverrides: Record<string, string> = {
    "region-amazonia": "Región Amazonía",
  };
  const destacados_regiones = destacados.map((d) => ({
    ...d,
    label_region: labelOverrides[d.slug_region] ?? d.label_region,
  }));

  // Dev-only: surface a summary warning if any contract slug currently
  // fails shape validation. Hidden in production so end-users don't see
  // debug banners; the full report is available via `deno task validate:data`.
  let warnings: Record<string, unknown> | null = null;
  if (!isProduction()) {
    const report = await getPersistedShapeReport();
    if (report && !report.ok) {
      warnings = {
        shape_drift: {
          failed: report.failed,
          contracts: report.contracts,
          total_diffs: report.totalDiffs,
          run_at: report.runAt,
        },
      };
    }
  }

  return c.json({
    lista_mapa,
    colombia,
    destacados_regiones,
    ...(warnings ? { _warnings: warnings } : {}),
  });
});

export default home;
