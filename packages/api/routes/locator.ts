import { Hono } from "hono";
import { renderLocator } from "../services/locator.ts";

const app = new Hono();

/**
 * GET /api/locator/:slug(.svg) — locator map: the region highlighted within
 * its context (municipio→department, department/núcleo/reserva/resguardo→
 * Colombia). Served as image/svg+xml for a plain <img> drop-in.
 */
app.get("/:slug", async (c) => {
  const slug = c.req.param("slug").replace(/\.svg$/, "");
  const svg = await renderLocator(slug);
  if (!svg) {
    return c.json({ error: `No locator for "${slug}"`, hint: "unknown region slug" }, 404);
  }
  return c.body(svg, 200, {
    "Content-Type": "image/svg+xml; charset=utf-8",
    "Cache-Control": "public, max-age=300",
  });
});

export default app;
