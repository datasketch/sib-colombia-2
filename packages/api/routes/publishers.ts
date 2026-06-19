import { Hono } from "hono";
import { queryRows, queryOne } from "../db.ts";

const publishers = new Hono();

const buildWheres = (
  region: string | undefined,
  tipoOrg: string | undefined,
  pais: string | undefined,
  q: string | undefined,
) => {
  const wheres: string[] = ["1=1"];
  if (region) wheres.push(`rp.slug_region = '${region.replace(/'/g, "''")}'`);
  if (tipoOrg) wheres.push(`p.tipo_organizacion = '${tipoOrg.replace(/'/g, "''")}'`);
  if (pais) wheres.push(`p.pais_publicacion = '${pais.replace(/'/g, "''")}'`);
  if (q) {
    const safe = q.replace(/'/g, "''").replace(/%/g, "");
    wheres.push(`LOWER(p.label) LIKE '%${safe.toLowerCase()}%'`);
  }
  return wheres.join(" AND ");
};

/**
 * GET /api/publishers
 * List publishers with filters: ?region, ?tipo_organizacion, ?pais, ?q
 *                  pagination: ?page=1&per_page=12
 * Returns { items, total, page, per_page }.
 */
publishers.get("/", async (c) => {
  const region = c.req.query("region");
  const tipoOrg = c.req.query("tipo_organizacion");
  const pais = c.req.query("pais");
  const q = c.req.query("q");
  const page = Math.max(1, Number(c.req.query("page") ?? 1));
  const perPage = Math.min(200, Math.max(1, Number(c.req.query("per_page") ?? 12)));
  const offset = (page - 1) * perPage;
  const where = buildWheres(region, tipoOrg, pais, q);

  const totalRow = await queryOne(`
    SELECT COUNT(*)::INTEGER AS n
    FROM region_publicador rp
    LEFT JOIN publicador p ON rp.slug_publicador = p.slug
    WHERE ${where}
  `);

  const rows = await queryRows(`
    SELECT
      rp.slug_region, rp.slug_publicador, rp.registros, rp.especies,
      p.label, p.pais_publicacion, p.tipo_organizacion, p.tipo_publicador,
      p.url_logo, p.url_socio
    FROM region_publicador rp
    LEFT JOIN publicador p ON rp.slug_publicador = p.slug
    WHERE ${where}
    ORDER BY rp.registros DESC
    LIMIT ${perPage} OFFSET ${offset}
  `);

  return c.json({
    items: rows,
    total: Number(totalRow?.n ?? 0),
    page,
    per_page: perPage,
  });
});

/**
 * GET /api/publishers/aggregates
 * Returns the InfoPublishers-shaped totals + tipo_organizacion breakdowns
 * for the given filters, so /mas/publicadores can reuse the same totals
 * card and pies that the region pages use.
 *
 * Excludes "No definido" tipo_organizacion to match prod behaviour.
 */
publishers.get("/aggregates", async (c) => {
  const region = c.req.query("region");
  const pais = c.req.query("pais");
  const q = c.req.query("q");
  const where = buildWheres(region, undefined, pais, q);

  const tipoRows = await queryRows(`
    SELECT
      COALESCE(p.tipo_organizacion, 'No definido') AS tipo_organizacion,
      COUNT(DISTINCT rp.slug_publicador)::INTEGER AS n,
      SUM(rp.registros)::BIGINT AS registros
    FROM region_publicador rp
    LEFT JOIN publicador p ON rp.slug_publicador = p.slug
    WHERE ${where}
    GROUP BY 1
    ORDER BY n DESC
  `);

  const real = tipoRows.filter(
    (r) => r.tipo_organizacion && r.tipo_organizacion !== "No definido",
  );

  const totalsRow = await queryOne(`
    SELECT
      COUNT(DISTINCT CASE WHEN p.tipo_publicador <> 'Internacional' THEN rp.slug_publicador END)::INTEGER AS nacionales,
      COUNT(DISTINCT CASE WHEN p.tipo_publicador  = 'Internacional' THEN rp.slug_publicador END)::INTEGER AS internacionales,
      COUNT(DISTINCT rp.slug_publicador)::INTEGER AS total
    FROM region_publicador rp
    LEFT JOIN publicador p ON rp.slug_publicador = p.slug
    WHERE ${where}
  `);

  return c.json({
    totals: {
      nacionales: Number(totalsRow?.nacionales ?? 0),
      internacionales: Number(totalsRow?.internacionales ?? 0),
      total: Number(totalsRow?.total ?? 0),
    },
    tipo_organizacion: real.map((r) => ({
      tipo_organizacion: r.tipo_organizacion,
      n: Number(r.n),
    })),
    registros_tipo_organizacion: real.map((r) => ({
      tipo_organizacion: r.tipo_organizacion,
      registros: Number(r.registros ?? 0),
    })),
  });
});

/**
 * GET /api/publishers/filters
 * Returns available filter options.
 */
publishers.get("/filters", async (c) => {
  const tipos = await queryRows(
    `SELECT DISTINCT tipo_organizacion FROM publicador WHERE tipo_organizacion IS NOT NULL ORDER BY tipo_organizacion`
  );
  const paises = await queryRows(
    `SELECT DISTINCT pais_publicacion FROM publicador WHERE pais_publicacion IS NOT NULL ORDER BY pais_publicacion`
  );
  const regions = await queryRows(
    `SELECT DISTINCT slug_region FROM region_publicador WHERE slug_region IS NOT NULL ORDER BY slug_region`
  );
  return c.json({
    tipo_organizacion: tipos.map((r) => r.tipo_organizacion),
    pais_publicacion: paises.map((r) => r.pais_publicacion),
    region: regions.map((r) => r.slug_region),
  });
});

export default publishers;
