import { Hono } from "hono";
import { queryRows } from "../db.ts";

/**
 * GET /api/grupos?tipo=biologico|interes
 *
 * Flat list for the explorer's GrupoPanel selectize. Includes a
 * leading `{slug: "todos", label: "Todos"}` sentinel that the client
 * normalizes to an omitted `grupo` param before calling /api/sibdata.
 *
 * Contract: API_REQUIREMENTS.md §2.1.
 */
const route = new Hono();

route.get("/", async (c) => {
  const tipo = c.req.query("tipo");
  if (tipo !== "biologico" && tipo !== "interes") {
    return c.json(
      { error: "tipo must be 'biologico' or 'interes'" },
      400,
    );
  }

  // Tree-walk via recursive CTE so each parent is followed by its
  // descendants, matching R's `data.tree::ToDataFrameNetwork(... arrange(path))`
  // in the legacy reference:55-72. `path` is the "/"-joined slug
  // chain so depth-first ordering falls out of `ORDER BY path`.
  // Roots use parent='0' as the sentinel in the upstream TSV.
  const rows = await queryRows(
    `WITH RECURSIVE tree AS (
       SELECT slug, label, parent, 0 AS level, slug AS path
       FROM grupo
       WHERE tipo = $1 AND parent = '0'
       UNION ALL
       SELECT g.slug, g.label, g.parent, t.level + 1, t.path || '/' || g.slug
       FROM grupo g
       JOIN tree t ON g.parent = t.slug
       WHERE g.tipo = $1
     )
     SELECT slug, label, parent, level
     FROM tree
     ORDER BY path`,
    [tipo],
  );

  const grupos = [
    { slug: "todos", label: "Todos", parent: null, level: 0 },
    ...rows.map((r) => ({
      slug: String(r.slug),
      label: String(r.label ?? r.slug),
      parent: r.parent == null ? null : String(r.parent),
      level: typeof r.level === "number" ? r.level : 0,
    })),
  ];

  return c.json(grupos);
});

export default route;
