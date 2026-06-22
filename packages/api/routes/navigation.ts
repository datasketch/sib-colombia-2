import { Hono } from "hono";
import {
  buildGrupoNav,
  buildTematicaNav,
  buildTerritorioNav,
} from "../services/navigation.ts";

const navigation = new Hono();

/**
 * GET /api/navigation/:type
 * Port of navigation_trees() from the legacy reference
 *
 * Types: tematica, grupo_biologico, grupo_interes, territorio
 * territorio requires ?region= query param
 *
 * The tree builders live in services/navigation.ts (shared with region-detail).
 */
navigation.get("/:type", async (c) => {
  const type = c.req.param("type");

  if (type === "tematica") {
    return c.json(await buildTematicaNav());
  } else if (type === "grupo_biologico") {
    return c.json(await buildGrupoNav("biologico"));
  } else if (type === "grupo_interes") {
    return c.json(await buildGrupoNav("interes"));
  } else if (type === "territorio") {
    const region = c.req.query("region");
    if (!region) {
      return c.json({ error: "region query param required for territorio" }, 400);
    }
    return c.json(await buildTerritorioNav(region));
  }

  return c.json({ error: `Unknown navigation type: ${type}` }, 400);
});

export default navigation;
