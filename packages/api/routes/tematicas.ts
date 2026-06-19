import { Hono } from "hono";
import { queryRows } from "../db.ts";

/**
 * GET /api/tematicas/tree
 *
 * Full nested tree of `tematica` rows where activa = TRUE. Used by
 * the Explorer's <TematicaPanel>. Includes the deep levels that
 * /api/navigation/tematica strips (cites children, amenazadas-global
 * → cr/en/vu, exoticas-total children).
 *
 * Contract: API_REQUIREMENTS.md §1.2.
 *
 * Response: TematicaNode[] (top-level array, no virtual root).
 *   type TematicaNode = {
 *     slug, label, tooltip?, descripcion?, orden?, icon?,
 *     children?: TematicaNode[]
 *   }
 */
const route = new Hono();

interface TematicaRow {
  parent: string | null;
  slug: string;
  label: string;
  orden: number | null;
  tooltip: string | null;
  descripcion: string | null;
  activa: boolean;
  icon: boolean;
}

interface TematicaNode {
  slug: string;
  label: string;
  tooltip?: string;
  descripcion?: string;
  orden?: number;
  icon?: boolean;
  children?: TematicaNode[];
}

function buildTree(rows: TematicaRow[]): TematicaNode[] {
  const byParent = new Map<string | null, TematicaRow[]>();
  for (const r of rows) {
    const key = r.parent ?? null;
    const bucket = byParent.get(key) ?? [];
    bucket.push(r);
    byParent.set(key, bucket);
  }
  const sortKey = (r: TematicaRow) => r.orden ?? Number.MAX_SAFE_INTEGER;
  for (const bucket of byParent.values()) {
    bucket.sort((a, b) => sortKey(a) - sortKey(b) || a.label.localeCompare(b.label));
  }

  function toNode(r: TematicaRow): TematicaNode {
    const children = byParent.get(r.slug)?.map(toNode) ?? [];
    const node: TematicaNode = { slug: r.slug, label: r.label };
    if (r.tooltip) node.tooltip = r.tooltip;
    if (r.descripcion) node.descripcion = r.descripcion;
    if (r.orden != null) node.orden = r.orden;
    if (r.icon) node.icon = r.icon;
    if (children.length > 0) node.children = children;
    return node;
  }

  return (byParent.get(null) ?? []).map(toNode);
}

route.get("/tree", async (c) => {
  const rows = (await queryRows(
    `SELECT parent, slug, label, orden, tooltip, descripcion, activa, icon
     FROM tematica
     WHERE activa = TRUE`,
  )) as unknown as TematicaRow[];

  // The seed encodes top-level rows with parent = "0" (string zero) as a
  // sentinel for "no parent". data.tree::FromDataFrameNetwork in the
  // legacy R explorer treats it as the root edge; we collapse it to
  // null so buildTree's null-keyed root bucket picks them up.
  const tree = buildTree(
    rows.map((r) => {
      const parentRaw = r.parent == null ? null : String(r.parent);
      return {
        parent: parentRaw === "0" ? null : parentRaw,
        slug: String(r.slug),
        label: String(r.label ?? r.slug),
        orden: r.orden == null ? null : Number(r.orden),
        tooltip: r.tooltip == null ? null : String(r.tooltip),
        descripcion: r.descripcion == null ? null : String(r.descripcion),
        activa: Boolean(r.activa),
        icon: Boolean(r.icon),
      };
    }),
  );

  return c.json(tree);
});

export default route;
