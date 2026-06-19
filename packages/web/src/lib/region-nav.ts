/**
 * Region data + search for the navbar's "Regiones" menu.
 *
 * Reuses the explorer's `buildRegionTree` (one taxonomy source) and maps each
 * region to its site URL. Mirrors the explorer's global region search so the
 * navbar can offer the same find-by-typing across departments, municipios,
 * núcleos and special regions now that the list is large.
 */
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "../api/client";
import type { Region } from "../api/types";
import { buildRegionTree, type RegionTreeData } from "../features/explorador/lib/region-tree";

export type RegionGroup =
  | "nacional"
  | "departamentos"
  | "municipio"
  | "nucleos"
  | "especial";

export interface RegionSearchResult {
  /** Region slug. */
  value: string;
  /** Display label (núcleo prefix stripped; municipios shown as "Dept / Muni"). */
  label: string;
  /** Site URL for this region. */
  href: string;
  group: RegionGroup;
}

/** Section headers + render order, matching the explorer picker. */
export const REGION_SECTION_LABEL: Record<RegionGroup, string> = {
  nacional: "Nacional",
  departamentos: "Departamentos",
  municipio: "Municipios",
  nucleos: "Núcleos (NDFyB)",
  especial: "Especial",
};
export const REGION_SECTION_ORDER: RegionGroup[] = [
  "nacional",
  "departamentos",
  "municipio",
  "nucleos",
  "especial",
];

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/**
 * Flatten the region tree into a searchable, URL-bearing list. Routes (see
 * App.tsx): departamento/núcleo → `/<slug>`, municipio → `/<dept>/<muni>`,
 * especial → `/especial/<slug>`, país → `/colombia`.
 */
function flattenRegions(tree: RegionTreeData): RegionSearchResult[] {
  const out: RegionSearchResult[] = [];
  for (const r of tree.nacional) {
    out.push({ value: r.value, label: r.label, href: `/${r.value}`, group: "nacional" });
  }
  for (const d of tree.departamentos) {
    out.push({ value: d.value, label: d.label, href: `/${d.value}`, group: "departamentos" });
    for (const m of d.municipios) {
      out.push({
        value: m.value,
        label: `${d.label} / ${m.label}`,
        href: `/${d.value}/${m.value}`,
        group: "municipio",
      });
    }
  }
  for (const r of tree.nucleos) {
    // The subsection header already says NDFyB; drop the redundant prefix.
    out.push({
      value: r.value,
      label: r.label.replace(/^NDFyB\s+/i, ""),
      href: `/${r.value}`,
      group: "nucleos",
    });
  }
  for (const r of tree.especial) {
    out.push({ value: r.value, label: r.label, href: `/especial/${r.value}`, group: "especial" });
  }
  return out;
}

/** Build the searchable region list from a flat `/api/regions` response. */
export function regionsToSearchList(regions: Region[]): RegionSearchResult[] {
  return flattenRegions(buildRegionTree(regions));
}

/** Accent/case-insensitive substring filter over label and slug. */
export function searchRegions(
  list: RegionSearchResult[],
  query: string,
): RegionSearchResult[] {
  const q = norm(query.trim());
  if (!q) return [];
  return list.filter((r) => norm(r.label).includes(q) || norm(r.value).includes(q));
}

/**
 * Live region list, shared (by query key) with the explorer's own fetch so
 * opening the menu never double-fetches. Mounts only when the menu is open,
 * so most page loads don't hit `/api/regions` at all.
 */
export function useRegions() {
  return useQuery({
    queryKey: ["regions"],
    queryFn: () => fetchApi<Region[]>("/regions"),
    staleTime: Infinity,
  });
}
