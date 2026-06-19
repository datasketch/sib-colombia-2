import { Hono } from "hono";
import { getLabelMap } from "../services/ind_meta.ts";

/**
 * GET /api/labels?indicadores=a,b,c
 *
 * Translate indicator slugs to Spanish labels from `ind_meta`. Unknown
 * slugs fall back to the slug itself (so the UI still renders something
 * readable instead of undefined).
 *
 * Contract: API_REQUIREMENTS.md §1.4.
 *
 * Response: `{ [slug]: string }` — one entry per requested slug.
 */
const route = new Hono();

route.get("/", async (c) => {
  const raw = c.req.query("indicadores") ?? "";
  const slugs = raw.split(",").map((s) => s.trim()).filter(Boolean);
  if (slugs.length === 0) {
    return c.json(
      { error: "indicadores is required (comma-separated list)" },
      400,
    );
  }

  const byIndicador = await getLabelMap();
  const result: Record<string, string> = {};
  for (const s of slugs) {
    const label = byIndicador.get(s);
    result[s] = label ?? s; // fallback: slug itself
  }
  return c.json(result);
});

export default route;
