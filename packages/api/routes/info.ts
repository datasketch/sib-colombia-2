import { Hono } from "hono";
import { queryRows } from "../db.ts";
import { dirname, fromFileUrl, join } from "https://deno.land/std@0.224.0/path/mod.ts";

const __dirname = dirname(fromFileUrl(import.meta.url));
const info = new Hono();

/** GET /api/info/glossary */
info.get("/glossary", async (c) => {
  const rows = await queryRows("SELECT * FROM glosario");
  return c.json(rows);
});

/**
 * Repair a known upstream content typo before the answer reaches
 * react-markdown: FAQ answers write links as `[text] (url)` with a stray
 * space between `]` and `(`, which is invalid markdown — react-markdown
 * renders it as literal text, so the link never appears. Collapse the space
 * so the link parses. See ISSUES.md DQ-004 (real fix is upstream: remove the
 * space in the Texto Bio Cifras sheet). Reported as upstream #26.
 */
function fixMarkdownLinkSpacing(value: unknown): unknown {
  return typeof value === "string" ? value.replace(/\]\s+\(/g, "](") : value;
}

/**
 * Repair another upstream content placeholder: several FAQ answers end with
 * `[link a más/metodología]` — bracket text with no `(url)`, so it isn't a
 * valid markdown link and react-markdown renders it verbatim. Resolve the
 * placeholder to the in-app Metodología route. See ISSUES.md DQ-005 (real fix
 * is upstream: write a real link in the Texto Bio Cifras sheet). Upstream #26.
 */
function fixMethodologyPlaceholderLink(value: unknown): unknown {
  return typeof value === "string"
    ? value.replace(/\[link a más\/metodología\]/gi, "[aquí](/mas/metodologia)")
    : value;
}

/** GET /api/info/faq */
info.get("/faq", async (c) => {
  const rows = await queryRows("SELECT * FROM preg_frecuentes");
  for (const row of rows) {
    row.respuesta = fixMethodologyPlaceholderLink(
      fixMarkdownLinkSpacing(row.respuesta),
    );
  }
  return c.json(rows);
});

/** GET /api/info/tooltips */
info.get("/tooltips", async (c) => {
  const rows = await queryRows("SELECT slug, tooltip FROM tematica");
  return c.json(rows);
});

/** GET /api/info/methodology */
info.get("/methodology", async (c) => {
  const filePath = join(__dirname, "..", "static", "metodologia.json");
  try {
    const content = await Deno.readTextFile(filePath);
    return c.body(content, 200, { "content-type": "application/json" });
  } catch {
    return c.json({ error: "Methodology not available" }, 404);
  }
});

export default info;
