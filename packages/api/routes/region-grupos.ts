import { Hono } from "hono";
import { getRegionGrupoData } from "../services/grupo-data.ts";

const regionGrupos = new Hono();

/**
 * GET /api/regions/:slug/grupos?tipo=biologico|interes
 *
 * Returns just the grupo array for a region — the heaviest slice of
 * the bundled /api/regions/:slug response (~725 KiB for biologico,
 * ~252 KiB for interes on a typical department).
 *
 * Carving this out lets the React region page render the banner +
 * map immediately while the grupos sections load progressively, and
 * keeps each request's DuckDB working-set small enough that the Deno
 * Deploy isolate doesn't OOM under concurrent users.
 */
regionGrupos.get("/:slug/grupos", async (c) => {
  const slug = c.req.param("slug");
  const tipo = c.req.query("tipo");

  if (!/^[a-z0-9-]+$/.test(slug)) {
    return c.json({ error: "Invalid slug" }, 400);
  }
  if (tipo !== "biologico" && tipo !== "interes") {
    return c.json({ error: "tipo must be 'biologico' or 'interes'" }, 400);
  }

  try {
    const rows = await getRegionGrupoData(slug, tipo);
    return c.json(rows);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Error fetching grupos for ${slug}/${tipo}:`, err);
    return c.json({ error: message }, 500);
  }
});

export default regionGrupos;
