import type { Region } from "../../../api/types.ts";

export interface RegionLeaf {
  value: string;
  label: string;
}

export interface DeptBranch {
  value: string;
  label: string;
  municipios: RegionLeaf[];
}

export interface RegionTreeData {
  /** País — colombia. */
  nacional: RegionLeaf[];
  /** Departamentos, each with its municipios as drill-down leaves. */
  departamentos: DeptBranch[];
  /** The 22 Núcleos de Desarrollo Forestal y de la Biodiversidad (NDFyB). */
  nucleos: RegionLeaf[];
  /** Regiones naturales / reservas / territorios indígenas. */
  especial: RegionLeaf[];
}

const norm = (s: string | null | undefined) =>
  (s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

type Group = "nacional" | "departamentos" | "municipio" | "nucleos" | "especial" | null;

/** Accent/case-tolerant — the API returns "País", "Departamento", etc. */
function classify(subtipo: string | null | undefined): Group {
  const s = norm(subtipo);
  if (s === "pais") return "nacional";
  if (s === "departamento" || s === "departamentos") return "departamentos";
  if (s === "municipio") return "municipio";
  if (s === "ndfyb") return "nucleos";
  if (
    s === "regiones naturales" ||
    s === "reservas forestales protectoras" ||
    s === "territorios indigenas" ||
    s === "especial"
  ) {
    return "especial";
  }
  return null;
}

/**
 * True when `slug` is a *leaf* region — a municipio or an individual
 * núcleo (NDFyB). Leaves have no subregional geometry, so they drop the
 * choropleth and default to cards. The NDFyB aggregate bucket
 * (`parent === "0"`) is not a leaf.
 */
export function isLeafRegionSlug(regions: Region[], slug: string | null): boolean {
  if (!slug) return false;
  const r = regions.find((x) => x.slug === slug);
  if (!r) return false;
  const g = classify(r.subtipo);
  if (g === "municipio") return true;
  if (g === "nucleos") return r.parent !== "0";
  return false;
}

/**
 * Fold the flat `/api/regions` list into the picker's tree shape.
 *
 * - País → `nacional`.
 * - Departamento → `departamentos`, deduped by slug (a department can
 *   appear under several parents, e.g. `colombia` and `region-amazonia`).
 * - Municipio → leaf under its `parent` department, deduped by slug. The
 *   ~66 `region-amazonia`-parented municipio rows are duplicates of the
 *   department rows; since `region-amazonia` is not a department branch,
 *   they are ignored here and the municipio still shows under its real
 *   department.
 * - Regiones naturales / reservas / territorios → `especial`. The
 *   `parent === "0"` bucket rows are not selectable and are dropped,
 *   matching `R/available.R`'s `parent != "0"` filter.
 */
export function buildRegionTree(regions: Region[]): RegionTreeData {
  const nacional: RegionLeaf[] = [];
  const especial: RegionLeaf[] = [];
  const nucleos: RegionLeaf[] = [];
  const seenNac = new Set<string>();
  const seenEsp = new Set<string>();
  const seenNuc = new Set<string>();
  const deptOrder: string[] = [];
  const deptBySlug = new Map<string, DeptBranch>();
  const muniByDept = new Map<string, Map<string, RegionLeaf>>();

  for (const r of regions) {
    switch (classify(r.subtipo)) {
      case "nacional":
        if (!seenNac.has(r.slug)) {
          seenNac.add(r.slug);
          nacional.push({ value: r.slug, label: r.label });
        }
        break;
      case "departamentos":
        if (!deptBySlug.has(r.slug)) {
          deptBySlug.set(r.slug, { value: r.slug, label: r.label, municipios: [] });
          deptOrder.push(r.slug);
        }
        break;
      case "municipio": {
        if (!r.parent) break;
        let m = muniByDept.get(r.parent);
        if (!m) {
          m = new Map();
          muniByDept.set(r.parent, m);
        }
        if (!m.has(r.slug)) m.set(r.slug, { value: r.slug, label: r.label });
        break;
      }
      case "nucleos":
        if (r.parent === "0") break; // the NDFyB aggregate bucket, not selectable
        if (!seenNuc.has(r.slug)) {
          seenNuc.add(r.slug);
          nucleos.push({ value: r.slug, label: r.label });
        }
        break;
      case "especial":
        if (r.parent === "0") break; // non-selectable bucket row
        if (!seenEsp.has(r.slug)) {
          seenEsp.add(r.slug);
          especial.push({ value: r.slug, label: r.label });
        }
        break;
    }
  }

  const collator = new Intl.Collator("es");
  const byLabel = (a: RegionLeaf, b: RegionLeaf) => collator.compare(a.label, b.label);

  const departamentos = deptOrder
    .map((slug) => ({
      ...deptBySlug.get(slug)!,
      municipios: Array.from(muniByDept.get(slug)?.values() ?? []).sort(byLabel),
    }))
    .sort(byLabel);

  nacional.sort(byLabel);
  nucleos.sort(byLabel);
  especial.sort(byLabel);

  return { nacional, departamentos, nucleos, especial };
}
