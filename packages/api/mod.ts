import { Hono } from "hono";
import { cors } from "hono/cors";
import { dirname, fromFileUrl, join } from "https://deno.land/std@0.224.0/path/mod.ts";
import { cacheMiddleware } from "./middleware/cache.ts";
import { serveStaticFile, serveWebApp } from "./static.ts";
import info from "./routes/info.ts";
import navigation from "./routes/navigation.ts";
import home from "./routes/home.ts";
import regions from "./routes/regions.ts";
import regionDetail from "./routes/region-detail.ts";
import regionGrupos from "./routes/region-grupos.ts";
import publishers from "./routes/publishers.ts";
import sibdata from "./routes/sibdata.ts";
import grupos from "./routes/grupos.ts";
import tematicas from "./routes/tematicas.ts";
import labels from "./routes/labels.ts";
import species from "./routes/species.ts";
import locator from "./routes/locator.ts";
import health from "./routes/health.ts";
import { NotFoundError, ValidationError } from "./services/sibdata.ts";

const app = new Hono();

// Middleware
app.use("*", cors());
// Cache only public read endpoints
app.use("/api/info/*", cacheMiddleware());
app.use("/api/navigation/*", cacheMiddleware());
app.use("/api/home/*", cacheMiddleware());
app.use("/api/regions/*", cacheMiddleware());
app.use("/api/publishers/*", cacheMiddleware());
app.use("/api/sibdata/*", cacheMiddleware());
app.use("/api/grupos/*", cacheMiddleware());
app.use("/api/tematicas/*", cacheMiddleware());
app.use("/api/labels/*", cacheMiddleware());
app.use("/api/species/*", cacheMiddleware());
app.use("/api/locator/*", cacheMiddleware());

// Health probe (no cache — must reflect live DB/seed/shape state)
app.route("/api/health", health);

// Public API routes
app.route("/api/info", info);
app.route("/api/navigation", navigation);
app.route("/api/home", home);
app.route("/api/regions", regions);
// regionGrupos before regionDetail so /:slug/grupos matches first.
app.route("/api/regions", regionGrupos);
app.route("/api/regions", regionDetail);
app.route("/api/publishers", publishers);
app.route("/api/sibdata", sibdata);
app.route("/api/grupos", grupos);
app.route("/api/tematicas", tematicas);
app.route("/api/labels", labels);
app.route("/api/species", species);
app.route("/api/locator", locator);

// Central error handler — every route that throws gets translated to a
// spec `{ error, hint? }` response. Never echo the raw `err.message` in
// the 500 case; it can leak SQL / file paths. Log server-side only.
app.onError((err, c) => {
  if (err instanceof ValidationError) {
    return c.json({ error: err.message }, 400);
  }
  if (err instanceof NotFoundError) {
    return c.json({ error: err.message }, 404);
  }
  console.error(`[api] ${c.req.method} ${c.req.path} — unhandled:`, err);
  return c.json(
    {
      error: "Internal server error",
      hint: "Check the server logs for details.",
    },
    500,
  );
});

// Health check
app.get("/_health", (c) => c.json({ status: "ok", service: "sibdata-api" }));

// Static files: GeoJSON maps and icons
app.get("/static/*", (c) => serveStaticFile(c.req.path));

// SPA: serve packages/web/dist for all other paths
// In dev mode (SIBDATA_DEV=1), skip the dist folder so Vite handles the frontend.
// In production, this serves the built React app with SPA fallback.
const isDev = Deno.env.get("SIBDATA_DEV") === "1";
app.get("*", async (c) => {
  // Unknown /api/* paths are genuine 404s — never fall through to the SPA
  // shell, which would mask a removed or mistyped endpoint behind a 200 HTML
  // response instead of a clear JSON error.
  if (c.req.path.startsWith("/api/")) {
    return c.json({ error: "Not found", path: c.req.path }, 404);
  }
  if (isDev) {
    return c.json(
      {
        error: "Dev mode — open http://localhost:5173/ in your browser",
        api: "/_health",
      },
      404
    );
  }
  const response = await serveWebApp(c.req.path);
  if (response) return response;
  return c.json(
    {
      error: "Frontend not built",
      hint: "Run 'deno task build:web' for production, or 'deno task dev' for dev",
      api: "/_health",
    },
    404
  );
});

const port = parseInt(Deno.env.get("PORT") ?? "3001");

// Detect whether the React frontend has been built (and we're not in dev mode)
const __dirname = dirname(fromFileUrl(import.meta.url));
const webDistExists = !isDev && await (async () => {
  try {
    const stat = await Deno.stat(join(__dirname, "..", "web", "dist"));
    return stat.isDirectory;
  } catch {
    return false;
  }
})();

const banner = webDistExists
  ? `
╭─────────────────────────────────────────────────────╮
│  🌿  SIB Colombia — production mode                 │
│                                                     │
│  ➜  Open:    http://localhost:${port}/               │
│  ➜  API:     http://localhost:${port}/api/*          │
╰─────────────────────────────────────────────────────╯`
  : `
╭─────────────────────────────────────────────────────╮
│  🌿  SIB Colombia — dev mode (frontend not built)   │
│                                                     │
│  ➜  Open the Vite dev server:                       │
│        http://localhost:5173/                       │
│                                                     │
│  ➜  Direct API:  http://localhost:${port}/api/*      │
│                                                     │
│  (Vite proxies /api/* and /static/* to this server) │
╰─────────────────────────────────────────────────────╯`;

console.log(banner);

Deno.serve({ port }, app.fetch);
