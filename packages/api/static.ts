import { join, resolve, normalize, dirname, fromFileUrl } from "https://deno.land/std@0.224.0/path/mod.ts";

const __dirname = dirname(fromFileUrl(import.meta.url));
const STATIC_ROOT = resolve(join(__dirname, "static"));
const WEB_DIST = resolve(join(__dirname, "..", "web", "dist"));

const CONTENT_TYPES: Record<string, string> = {
  ".geojson": "application/geo+json; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".map": "application/json; charset=utf-8",
};

function contentTypeFor(filePath: string): string {
  const dotIdx = filePath.lastIndexOf(".");
  if (dotIdx === -1) return "application/octet-stream";
  const ext = filePath.slice(dotIdx).toLowerCase();
  return CONTENT_TYPES[ext] ?? "application/octet-stream";
}

async function readSafe(root: string, requestPath: string): Promise<{ file: Uint8Array; type: string } | null> {
  const target = resolve(join(root, requestPath));
  const normalized = normalize(target);
  if (!normalized.startsWith(root)) return null; // path traversal
  try {
    const stat = await Deno.stat(normalized);
    if (!stat.isFile) return null;
    const file = await Deno.readFile(normalized);
    return { file, type: contentTypeFor(normalized) };
  } catch {
    return null;
  }
}

/**
 * Serve a file from packages/api/static/
 * Used for /static/geo/{slug}.geojson and /static/icons/{slug}.svg
 */
export async function serveStaticFile(pathSegment: string): Promise<Response> {
  const cleaned = pathSegment.replace(/^\/?static\//, "");
  const result = await readSafe(STATIC_ROOT, cleaned);
  if (!result) return new Response("Not found", { status: 404 });
  return new Response(result.file as BodyInit, {
    headers: {
      "content-type": result.type,
      "content-length": String(result.file.byteLength),
      "cache-control": "public, max-age=3600",
    },
  });
}

/**
 * Serve the built React app from packages/web/dist/
 * - /assets/* → matches dist/assets/*
 * - any other path → SPA fallback to index.html
 *
 * Returns null if the dist directory doesn't exist (dev mode — Vite handles
 * the frontend on its own port).
 */
export async function serveWebApp(requestPath: string): Promise<Response | null> {
  // Quick check: does dist exist?
  try {
    const stat = await Deno.stat(WEB_DIST);
    if (!stat.isDirectory) return null;
  } catch {
    return null;
  }

  // Strip leading slash
  const cleaned = requestPath.replace(/^\//, "");

  // Try the exact file (for /assets/index-XXX.js, /vite.svg, etc.)
  if (cleaned) {
    const result = await readSafe(WEB_DIST, cleaned);
    if (result) {
      const isHashed = /-[A-Za-z0-9_-]{8,}\./.test(cleaned);
      return new Response(result.file as BodyInit, {
        headers: {
          "content-type": result.type,
          "content-length": String(result.file.byteLength),
          "cache-control": isHashed
            ? "public, max-age=31536000, immutable"
            : "public, max-age=300",
        },
      });
    }
  }

  // SPA fallback: serve index.html
  const indexResult = await readSafe(WEB_DIST, "index.html");
  if (!indexResult) return null;
  return new Response(indexResult.file as BodyInit, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-cache",
    },
  });
}
