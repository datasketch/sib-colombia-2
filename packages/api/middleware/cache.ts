import type { Context, Next } from "hono";

interface CacheEntry {
  data: string;
  contentType: string;
  expires: number;
}

const cache = new Map<string, CacheEntry>();
const DEFAULT_TTL = 60 * 60 * 1000; // 1 hour
const MAX_ENTRIES = 500;

/**
 * `Cache-Control` max-age (seconds) sent to clients and CDNs.
 * API_REQUIREMENTS.md §3.1. Shorter than the in-process TTL so content
 * refreshes reasonably fast downstream while the server-side LRU
 * absorbs the hot-path load.
 */
const PUBLIC_MAX_AGE_SECONDS = 300;

function setCacheHeader(c: Context) {
  c.header(
    "Cache-Control",
    `public, max-age=${PUBLIC_MAX_AGE_SECONDS}`,
  );
}

/**
 * In-memory LRU cache middleware.
 * Caches GET responses by URL path + query string. Also sets the
 * `Cache-Control: public, max-age=300` header on every 200 response so
 * browsers and any CDN can cache too (spec §3.1).
 */
export function cacheMiddleware(ttlMs = DEFAULT_TTL) {
  return async (c: Context, next: Next) => {
    if (c.req.method !== "GET") {
      await next();
      return;
    }

    const key = c.req.url;
    const entry = cache.get(key);

    if (entry && entry.expires > Date.now()) {
      setCacheHeader(c);
      return c.body(entry.data, 200, {
        "Content-Type": entry.contentType,
        "X-Cache": "HIT",
        "Cache-Control": `public, max-age=${PUBLIC_MAX_AGE_SECONDS}`,
      });
    }

    // Remove expired entry
    if (entry) cache.delete(key);

    await next();

    // Cache successful JSON responses
    if (c.res.status === 200) {
      setCacheHeader(c);
      const cloned = c.res.clone();
      const body = await cloned.text();
      const contentType = cloned.headers.get("Content-Type") ?? "application/json";

      // Evict oldest if at capacity
      if (cache.size >= MAX_ENTRIES) {
        const oldest = cache.keys().next().value;
        if (oldest) cache.delete(oldest);
      }

      cache.set(key, {
        data: body,
        contentType,
        expires: Date.now() + ttlMs,
      });
    }
  };
}

/** Clear all cached entries. */
export function clearCache() {
  cache.clear();
}
