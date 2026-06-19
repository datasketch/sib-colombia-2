import { Hono } from "hono";
import { queryRows } from "../db.ts";
import { buildTree } from "@sibdata/shared";

const navigation = new Hono();

/**
 * GET /api/navigation/:type
 * Port of navigation_trees() from the legacy reference
 *
 * Types: tematica, grupo_biologico, grupo_interes, territorio
 * territorio requires ?region= query param
 */
navigation.get("/:type", async (c) => {
  const type = c.req.param("type");

  let rows: Record<string, unknown>[];

  if (type === "grupo_biologico" || type === "grupo_interes") {
    const tipo = type === "grupo_biologico" ? "biologico" : "interes";
    rows = await queryRows(
      `SELECT parent, slug, label, descripcion, ref_id, marino, icon FROM grupo WHERE tipo = $1`,
      [tipo]
    );
  } else if (type === "tematica") {
    rows = await queryRows(`
      SELECT * FROM tematica
      WHERE parent != 'cites'
        AND parent != 'amenazadas_global'
        AND parent != 'amenazadas_nacional'
        AND parent != 'exoticas-total'
    `);
    // Filter active only
    rows = rows.filter((r) => r.activa === "TRUE" || r.activa === true);
  } else if (type === "territorio") {
    const region = c.req.query("region");
    if (!region) {
      return c.json({ error: "region query param required for territorio" }, 400);
    }
    // Special regions have no territory
    if (
      region === "reserva-forestal-la-planada" ||
      region === "resguardo-indigena-pialapi-pueblo-viejo"
    ) {
      return c.json([]);
    }
    rows = await queryRows(
      `SELECT parent, slug AS slug_region, label, tipo, subtipo FROM region
       WHERE slug = $1 OR parent = $1`,
      [region]
    );
    // Exclude region-amazonia children for territory view
    rows = rows.filter((r) => r.parent !== "region-amazonia");
    // Rename slug_region → slug for tree builder
    rows = rows.map((r) => ({ ...r, slug: r.slug_region as string }));
  } else {
    return c.json({ error: `Unknown navigation type: ${type}` }, 400);
  }

  if (rows.length === 0) return c.json([]);

  // Add icon URLs where applicable
  rows = rows.map((r) => {
    if (r.icon) {
      return {
        ...r,
        icon_white: `static/icons/${r.slug}-white.svg`,
        icon_black: `static/icons/${r.slug}-black.svg`,
      };
    }
    return r;
  });

  const tree = buildTree(rows as { slug: string; parent: string; label?: string }[]);
  return c.json(tree);
});

export default navigation;
