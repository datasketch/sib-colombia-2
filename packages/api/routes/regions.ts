import { Hono } from "hono";
import { queryRows } from "../db.ts";

const regions = new Hono();

/**
 * GET /api/regions
 * List all regions with type/subtype for navigation dropdowns.
 */
regions.get("/", async (c) => {
  const rows = await queryRows(`
    SELECT slug, label, tipo, subtipo, parent
    FROM region
    ORDER BY subtipo, label
  `);
  return c.json(rows);
});

export default regions;
