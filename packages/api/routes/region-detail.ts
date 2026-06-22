import { Hono } from "hono";
import { dirname, fromFileUrl, join } from "https://deno.land/std@0.224.0/path/mod.ts";
import { queryRows, queryOne } from "../db.ts";
import { getRegionGeneral, getSubregions } from "../services/region-general.ts";
import { getGallery } from "../services/gallery.ts";
import { getRegionSlides } from "../services/slides.ts";
import { getTematicaList } from "../services/tematica-list.ts";
import { getRegionGrupoData } from "../services/grupo-data.ts";
import { getRegionPublishers, getRegionSponsors } from "../services/publishers.ts";
import { getMapData } from "../services/map-data.ts";
import { getSlugDrift } from "../services/shape-drift.ts";
import { isProduction } from "../env.ts";
import { buildGrupoNav, buildTematicaNav } from "../services/navigation.ts";

const __dirname = dirname(fromFileUrl(import.meta.url));
// Only used by the dev-only ?static=1 branch below (disabled in production).
const STATIC_REGIONS_DIR = join(__dirname, "..", "static");

const regionDetail = new Hono();

/**
 * GET /api/regions/:slug
 * Computes the region profile from DuckDB by default.
 *
 * ?static=1 — serve the frozen packages/api/static/{slug}.json if it exists
 *             (useful for legacy-vs-live shape diffs). 404 if no such file.
 *
 * ?lean=1   — omit the heavy `grupos_biologicos` and `grupos_interes`
 *             fields (~1 MiB combined on a typical department) and skip
 *             the DuckDB queries that build them. Pair with
 *             /api/regions/:slug/grupos?tipo=… to load each grupo
 *             slice independently. The React region page uses this so
 *             the banner/map render fast and grupos fill in
 *             progressively.
 *
 * `?nostatic=1` was the old opt-in-to-DB flag; it's now a no-op (DB is the
 * default). The shape-contract tests and compare-region script still pass it
 * and still work unchanged.
 */
regionDetail.get("/:slug", async (c) => {
  const slug = c.req.param("slug");
  const serveStatic = c.req.query("static") === "1";
  const lean = c.req.query("lean") === "1";

  // Validate slug (only lowercase letters, digits, hyphens)
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return c.json({ error: "Invalid slug" }, 400);
  }

  // Opt-in static path (dev only — in prod we forget about static files)
  if (serveStatic) {
    if (isProduction()) {
      return c.json(
        { error: "Static snapshots are disabled in production (SIBDATA_ENV=production)." },
        404,
      );
    }
    const staticPath = join(STATIC_REGIONS_DIR, `${slug}.json`);
    try {
      const stat = await Deno.stat(staticPath);
      if (stat.isFile) {
        const content = await Deno.readTextFile(staticPath);
        return c.body(content, 200, { "content-type": "application/json" });
      }
    } catch {
      // fall through to 404
    }
    return c.json({ error: `No static snapshot for ${slug}` }, 404);
  }

  try {
    // In lean mode, skip the two heavy grupo-data queries entirely —
    // the client fetches them via /api/regions/:slug/grupos?tipo=…
    // in parallel with this request. Cuts the bundled response from
    // ~1.3 MiB to ~225 KiB and removes the bulk of the DuckDB
    // working-set per request.
    const [
      generalInfo,
      gallery,
      slides,
      tematica,
      gruposBio,
      gruposInt,
      patrocinador,
      publicadores,
    ] = await Promise.all([
      getRegionGeneral(slug),
      getGallery(slug),
      getRegionSlides(slug),
      getTematicaList(slug),
      lean
        ? Promise.resolve([] as Record<string, unknown>[])
        : getRegionGrupoData(slug, "biologico"),
      lean
        ? Promise.resolve([] as Record<string, unknown>[])
        : getRegionGrupoData(slug, "interes"),
      getRegionSponsors(slug),
      getRegionPublishers(slug),
    ]);

    // Detect if this is a municipality (subtipo = Municipio)
    const regionInfoRow = await queryOne(
      `SELECT subtipo FROM region WHERE slug = $1 LIMIT 1`,
      [slug],
    );
    const isMunicipality =
      String(regionInfoRow?.subtipo ?? "").toLowerCase() === "municipio";

    // municipios_lista:
    // - colombia → empty (departamentos_lista is the populated list)
    // - bogota-dc → 1 entry: itself (it's a single-municipality "department")
    // - municipalities → empty (no children)
    // - other depts → all subregions (deduped)
    let subregLabels: Record<string, unknown>[];
    if (slug === "colombia") {
      subregLabels = [];
    } else if (slug === "bogota-dc") {
      subregLabels = [{ slug: "bogota-dc", label: "Bogotá, D. C." }];
    } else if (isMunicipality) {
      subregLabels = [];
    } else {
      const subregs = await getSubregions(slug);
      subregLabels = subregs.length > 0
        ? await queryRows(`
            SELECT DISTINCT slug, label FROM region WHERE slug IN (${subregs.map((s) => `'${s}'`).join(", ")})
          `)
        : [];
    }

    // departamentos_lista:
    // - For colombia: full list of all 33 departments
    // - For a department: the 4 "highlighted" siblings (boyaca, narino, santander, tolima)
    //   matching the static contract behavior
    const departamentosLista = slug === "colombia"
      ? await queryRows(`SELECT slug, label FROM departamento ORDER BY label`)
      : [
          { slug: "boyaca", label: "Boyacá" },
          { slug: "narino", label: "Nariño" },
          { slug: "santander", label: "Santander" },
          { slug: "tolima", label: "Tolima" },
        ];

    // Menu trees from DuckDB — the same source as /api/navigation/:type. These
    // replace the nav trees that used to be copied out of static/colombia.json,
    // so a region's response no longer depends on any static snapshot.
    const [navTematica, navGrupoBiologico, navGrupoInteres] = await Promise.all([
      buildTematicaNav(),
      buildGrupoNav("biologico"),
      buildGrupoNav("interes"),
    ]);

    // nav_territorio is region-specific: root → region → subregions.
    // - municipalities: empty array (no children)
    // - colombia: its 33 departments as subregions
    // - bogota-dc: single-municipality dept — no children array on the leaf
    // - other depts: all municipios as subregions
    let navTerritorio: unknown;
    if (isMunicipality) {
      navTerritorio = [];
    } else {
      const regionRow = await queryRows(
        `SELECT slug, label FROM region WHERE slug = $1`,
        [slug],
      );
      const regionLabel = (regionRow[0]?.label as string) ?? slug;
      const childNodes = slug === "colombia"
        ? departamentosLista.map((d) => ({ slug: d.slug, label: d.label }))
        : subregLabels.map((m) => ({ slug: m.slug, label: m.label }));
      const isBogota = slug === "bogota-dc";
      navTerritorio = {
        slug: "territorio",
        children: [
          {
            slug,
            label: regionLabel,
            ...(isBogota ? {} : { children: childNodes }),
          },
        ],
      };
    }

    // territorio: 3 entries matching the static contract (empty for munis)
    let territorio: unknown[];
    if (isMunicipality) {
      territorio = [];
    } else {
      const mapData = await getMapData(slug);
      const territorioCharts = slug === "colombia"
        ? [
            { title: "Especies por departamento", path: "", layout: "title/chart" },
            { title: "Registros por departamento", path: "", layout: "title/chart" },
          ]
        : [];
      territorio = [
        {
          slug: "municipios",
          label: slug === "colombia" ? "Departamentos" : "Municipios",
          map_data: mapData,
          charts: territorioCharts,
        },
        {
          slug: "areas-protegidas",
          label: "Áreas protegidas",
          title: "Próximamente tendrás acceso a la información de las áreas protegidas",
          charts: [],
        },
        {
          slug: "ecosistemas-estrategicos",
          label: "Ecosistemas estratégicos",
          title: "Próximamente tendrás acceso a la información de ecosistemas estratégicos",
          charts: [],
        },
      ];
    }

    const response: Record<string, unknown> = {
      general_info: generalInfo,
      nav_tematica: navTematica,
      nav_grupo_biologico: navGrupoBiologico,
      nav_grupo_interes: navGrupoInteres,
      nav_territorio: navTerritorio,
      gallery,
      slides,
      tematica,
      territorio,
      patrocinador,
      publicadores,
      municipios_lista: subregLabels,
    };
    // Always include the grupo keys in the response shape so the
    // client and shape contracts have a stable schema. In lean mode
    // they're empty arrays — the client knows to fetch the real
    // data from /api/regions/:slug/grupos?tipo=… in parallel.
    response.grupos_biologicos = gruposBio;
    response.grupos_interes = gruposInt;
    // departamentos_lista: only included for non-municipality regions
    if (!isMunicipality) {
      response.departamentos_lista = departamentosLista;
    }

    // Dev-only: attach shape-drift warnings if this slug has a
    // non-passing entry in the last persisted validation report.
    // Hidden in production so end-users don't see debug banners; the
    // full report is available via `deno task validate:data`.
    if (!isProduction()) {
      const drift = await getSlugDrift(slug);
      if (drift) {
        response._warnings = {
          shape_drift: {
            diff_count: drift.diffCount,
            error: drift.error ?? null,
          },
        };
      }
    }

    return c.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("not found")) {
      return c.json({ error: message }, 404);
    }
    console.error(`Error fetching region ${slug}:`, err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default regionDetail;
