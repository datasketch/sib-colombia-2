import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "./client";
import type {
  RegionData, HomeData, TreeNode, Region, GlossaryItem, FAQItem,
  Publisher, PublisherFilters,
} from "./types";

export function useHome() {
  return useQuery({
    queryKey: ["home"],
    queryFn: () => fetchApi<HomeData>("/home"),
  });
}

export function useRegion(slug: string) {
  return useQuery({
    queryKey: ["region", slug],
    // ?lean=1 omits the heavy grupos_biologicos / grupos_interes
    // arrays — those are loaded separately by useRegionGrupos so the
    // banner + map can render before the slow grupo fan-out finishes.
    queryFn: () => fetchApi<RegionData>(`/regions/${slug}?lean=1`),
    enabled: !!slug,
  });
}

export function useRegionGrupos(slug: string, tipo: "biologico" | "interes") {
  return useQuery({
    queryKey: ["region-grupos", slug, tipo],
    queryFn: () =>
      fetchApi<Record<string, unknown>[]>(`/regions/${slug}/grupos?tipo=${tipo}`),
    enabled: !!slug,
  });
}

export function useRegions() {
  return useQuery({
    queryKey: ["regions"],
    queryFn: () => fetchApi<Region[]>("/regions"),
  });
}

export function useNavigation(type: string, region?: string) {
  return useQuery({
    queryKey: ["nav", type, region],
    queryFn: () => {
      const qs = region ? `?region=${region}` : "";
      return fetchApi<TreeNode>(`/navigation/${type}${qs}`);
    },
  });
}

export function useGlossary() {
  return useQuery({
    queryKey: ["glossary"],
    queryFn: () => fetchApi<GlossaryItem[]>("/info/glossary"),
  });
}

export function useFAQ() {
  return useQuery({
    queryKey: ["faq"],
    queryFn: () => fetchApi<FAQItem[]>("/info/faq"),
  });
}

export function useMethodology() {
  return useQuery({
    queryKey: ["methodology"],
    queryFn: () => fetchApi<Record<string, string>>("/info/methodology"),
    staleTime: Infinity,
  });
}

export interface PublishersPage {
  items: Publisher[];
  total: number;
  page: number;
  per_page: number;
}

export function usePublishers(filters: {
  region?: string;
  tipo_organizacion?: string;
  pais?: string;
  q?: string;
  page?: number;
  per_page?: number;
}) {
  const params = new URLSearchParams();
  if (filters.region) params.set("region", filters.region);
  if (filters.tipo_organizacion) params.set("tipo_organizacion", filters.tipo_organizacion);
  if (filters.pais) params.set("pais", filters.pais);
  if (filters.q) params.set("q", filters.q);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.per_page) params.set("per_page", String(filters.per_page));
  const qs = params.toString();
  return useQuery({
    queryKey: ["publishers", filters],
    queryFn: () => fetchApi<PublishersPage>(`/publishers${qs ? "?" + qs : ""}`),
  });
}

export interface PublisherAggregates {
  totals: { nacionales: number; internacionales: number; total: number };
  tipo_organizacion: { tipo_organizacion: string; n: number }[];
  registros_tipo_organizacion: { tipo_organizacion: string; registros: number }[];
}

export function usePublisherAggregates(filters: {
  region?: string;
  pais?: string;
  q?: string;
}) {
  const params = new URLSearchParams();
  if (filters.region) params.set("region", filters.region);
  if (filters.pais) params.set("pais", filters.pais);
  if (filters.q) params.set("q", filters.q);
  const qs = params.toString();
  return useQuery({
    queryKey: ["publisher-aggregates", filters],
    queryFn: () => fetchApi<PublisherAggregates>(`/publishers/aggregates${qs ? "?" + qs : ""}`),
  });
}

export function usePublisherFilters() {
  return useQuery({
    queryKey: ["publisher-filters"],
    queryFn: () => fetchApi<PublisherFilters>("/publishers/filters"),
    staleTime: Infinity,
  });
}
