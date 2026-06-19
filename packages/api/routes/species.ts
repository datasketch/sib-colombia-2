import { Hono } from "hono";
import { queryRows } from "../db.ts";
import { expandTematica } from "@sibdata/shared";
import { regionExists } from "../services/region-general.ts";
import { NotFoundError } from "../services/sibdata.ts";

/**
 * GET /api/species?region=…&grupo=…&tematica=…&q=…&limit=…&offset=…
 *
 * Species list for the Explorer's right-column <SpeciesTable> and the
 * "Ver lista completa" modal. Server-side temática expansion lets the
 * client send either a parent (`cites`, `amenazadas-global`) or a
 * concrete subtematica (`cites-ii`, `amenazadas-global-cr`) without
 * caring about the mapping.
 *
 * Rows are ordered by `observaciones DESC, slug_especie ASC` — the
 * second key makes the order stable under pagination. Pagination is
 * opt-in; when `limit` is omitted the full dataset is returned.
 *
 * Contract: API_REQUIREMENTS.md §1.3 (+ 7.1 polish checklist).
 */
const route = new Hono();

const SLUG_RE = /^[a-z0-9-]+$/;

/** Hard cap so a single request can never return more than this many rows. */
const MAX_LIMIT = 5000;

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  if (raw == null || raw === "") return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) return NaN;
  return n;
}

route.get("/", async (c) => {
  const region = c.req.query("region");
  if (!region || !SLUG_RE.test(region)) {
    return c.json({ error: "region is required (slug)" }, 400);
  }

  const grupo = c.req.query("grupo");
  if (grupo && (grupo === "todos" || !SLUG_RE.test(grupo))) {
    return c.json(
      { error: "grupo must be a slug; omit it instead of sending 'todos'" },
      400,
    );
  }

  const tematica = c.req.query("tematica");
  if (tematica && !SLUG_RE.test(tematica)) {
    return c.json({ error: "tematica must be a slug" }, 400);
  }

  const qText = (c.req.query("q") ?? "").trim();
  if (qText.length > 200) {
    return c.json({ error: "q must be at most 200 characters" }, 400);
  }

  const limit = parsePositiveInt(c.req.query("limit"), -1);
  const offset = parsePositiveInt(c.req.query("offset"), 0);
  if (Number.isNaN(limit) || Number.isNaN(offset)) {
    return c.json(
      { error: "limit and offset must be non-negative integers" },
      400,
    );
  }
  const effLimit = limit > 0 ? Math.min(limit, MAX_LIMIT) : null;

  if (!(await regionExists(region))) {
    throw new NotFoundError(`region not found: ${region}`);
  }

  const tematicaSlugs: string[] | null = tematica
    ? expandTematica(tematica)
    : null;

  // Build the base query shared by both branches.
  const joins: string[] = [
    "FROM especie_region er",
    "LEFT JOIN especie e ON er.slug_especie = e.slug",
    "LEFT JOIN especie_meta em ON er.slug_especie = em.slug",
  ];
  const wheres: string[] = ["er.slug_region = $1"];
  const params: unknown[] = [region];

  if (tematicaSlugs) {
    joins.push(
      "INNER JOIN especie_tematica et ON er.slug_region = et.slug_region AND er.slug_especie = et.slug_especie",
    );
    joins.push("LEFT JOIN tematica t ON et.slug_tematica = t.slug");
    const placeholders = tematicaSlugs
      .map((_, i) => `$${params.length + 1 + i}`)
      .join(", ");
    wheres.push(`et.slug_tematica IN (${placeholders})`);
    params.push(...tematicaSlugs);
  }

  if (grupo) {
    joins.push(
      "INNER JOIN especie_grupo eg ON er.slug_especie = eg.slug_especie",
    );
    wheres.push(`eg.slug_grupo = $${params.length + 1}`);
    params.push(grupo);
  }

  if (qText) {
    wheres.push(
      `(e.species ILIKE $${params.length + 1} OR em.vernacular_name_es ILIKE $${params.length + 2})`,
    );
    const pattern = `%${qText}%`;
    params.push(pattern, pattern);
  }

  const baseColumns = `
    er.slug_especie,
    er.registros AS observaciones,
    e.species AS especie,
    e.kingdom AS reino,
    e.phylum AS filo,
    e.class AS clase,
    e."order" AS orden,
    e.family AS familia,
    e.genus AS genero,
    em.vernacular_name_es,
    em.url_gbif,
    em.url_cbc`;

  // When a tematica filter is active, a species can appear once per
  // expanded slug (e.g. a species that's CR and EN both). Dedup in SQL
  // with ROW_NUMBER so pagination works correctly.
  let sql: string;
  if (tematicaSlugs) {
    sql = `
      WITH ranked AS (
        SELECT
          ${baseColumns},
          et.slug_tematica,
          t.label AS tematica_label,
          ROW_NUMBER() OVER (
            PARTITION BY er.slug_especie
            ORDER BY er.registros DESC, et.slug_tematica ASC
          ) AS rn
        ${joins.join("\n        ")}
        WHERE ${wheres.join(" AND ")}
      )
      SELECT
        slug_especie, observaciones, especie, reino, filo, clase, orden,
        familia, genero, vernacular_name_es, url_gbif, url_cbc,
        slug_tematica, tematica_label
      FROM ranked
      WHERE rn = 1
      ORDER BY observaciones DESC, slug_especie ASC
    `;
  } else {
    sql = `
      SELECT ${baseColumns}
      ${joins.join("\n      ")}
      WHERE ${wheres.join(" AND ")}
      ORDER BY er.registros DESC, er.slug_especie ASC
    `;
  }

  if (effLimit !== null) {
    sql += `\n    LIMIT ${effLimit} OFFSET ${offset}`;
  }

  const rows = await queryRows(sql, params);
  return c.json(rows);
});

export default route;
