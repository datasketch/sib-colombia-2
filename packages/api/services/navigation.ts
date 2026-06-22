/**
 * Navigation tree builders over DuckDB. Port of navigation_trees() from
 * the legacy reference
 *
 * Extracted from routes/navigation.ts so the region-detail response can build
 * its menu trees from the DB directly — the same source the /api/navigation/:type
 * endpoint uses — instead of copying them out of the static colombia.json
 * snapshot. The route and region-detail are the two callers; behavior is
 * unchanged from the inline route logic.
 */
import { queryRows } from "../db.ts";
import { buildTree } from "@sibdata/shared";

type Row = Record<string, unknown>;

/** Special regions have no territory tree. */
const NO_TERRITORY = new Set([
  "reserva-forestal-la-planada",
  "resguardo-indigena-pialapi-pueblo-viejo",
]);

/** Attach icon_white/icon_black URLs to rows that carry an icon. */
function withIcons(rows: Row[]): Row[] {
  return rows.map((r) => {
    if (r.icon) {
      return {
        ...r,
        icon_white: `static/icons/${r.slug}-white.svg`,
        icon_black: `static/icons/${r.slug}-black.svg`,
      };
    }
    return r;
  });
}

function toTree(rows: Row[]): unknown {
  if (rows.length === 0) return [];
  return buildTree(
    withIcons(rows) as { slug: string; parent: string; label?: string }[],
  );
}

/** Temática menu (active temáticas, excluding the cites/amenazadas/exoticas roots). */
export async function buildTematicaNav(): Promise<unknown> {
  let rows = await queryRows(`
    SELECT * FROM tematica
    WHERE parent != 'cites'
      AND parent != 'amenazadas_global'
      AND parent != 'amenazadas_nacional'
      AND parent != 'exoticas-total'
  `);
  rows = rows.filter((r) => r.activa === "TRUE" || r.activa === true);
  return toTree(rows);
}

/** Grupo biológico / grupo de interés menu. */
export async function buildGrupoNav(
  tipo: "biologico" | "interes",
): Promise<unknown> {
  const rows = await queryRows(
    `SELECT parent, slug, label, descripcion, ref_id, marino, icon FROM grupo WHERE tipo = $1`,
    [tipo],
  );
  return toTree(rows);
}

/** Territorio menu for a region: root → region → subregions. */
export async function buildTerritorioNav(region: string): Promise<unknown> {
  if (NO_TERRITORY.has(region)) return [];
  let rows = await queryRows(
    `SELECT parent, slug AS slug_region, label, tipo, subtipo FROM region
     WHERE slug = $1 OR parent = $1`,
    [region],
  );
  // Exclude region-amazonia children for territory view.
  rows = rows.filter((r) => r.parent !== "region-amazonia");
  // Rename slug_region → slug for the tree builder.
  rows = rows.map((r) => ({ ...r, slug: r.slug_region as string }));
  return toTree(rows);
}
