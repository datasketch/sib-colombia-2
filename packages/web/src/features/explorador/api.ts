import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "../../api/client";
import type { Region } from "../../api/types";
import type { GrupoTipo, SibdataRow, SpeciesRow, TematicaNode } from "./types";

type QsValue = string | number | boolean | null | undefined;

/**
 * Build a query string, skipping null/undefined/empty values.
 */
function qs(params: Record<string, QsValue>): string {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === null || v === undefined || v === "") continue;
    if (typeof v === "boolean") search.set(k, v ? "1" : "0");
    else search.set(k, String(v));
  }
  const s = search.toString();
  return s ? `?${s}` : "";
}

// ---- /api/sibdata --------------------------------------------------------

export interface SibdataParams {
  region: string;
  tipo?: "registros" | "especies";
  tematica?: string | null;
  subtematica?: string | null;
  indicador?: string | null;
  grupo?: string | null;
  subregiones?: boolean;
  with_parent?: boolean;
  tidy?: boolean;
  n_especies?: boolean;
  all_indicators?: boolean;
}

/**
 * Shape assertion. The spec'd response is tidy long
 *   { slug_region, label_region, label, indicador, count, grupo?, cod_dane? }
 * If the API returns wide rows instead, this throws a loud error so the
 * UI's error state fires and the problem is visible — per the
 * "no silent fallbacks" project rule.
 */
function assertTidyRows(raw: unknown, url: string): SibdataRow[] {
  if (!Array.isArray(raw)) {
    throw new Error(`${url} — expected array response, got ${typeof raw}`);
  }
  if (raw.length === 0) return [];
  const first = raw[0] as Record<string, unknown>;
  if (!("indicador" in first) || !("count" in first)) {
    const keys = Object.keys(first).slice(0, 6).join(", ");
    throw new Error(
      `${url} — expected tidy long { slug_region, label_region, indicador, count, ... } ` +
        `but got wide rows with keys [${keys}]. See API_REQUIREMENTS.md §1.1.`,
    );
  }
  return raw as SibdataRow[];
}

export function useSibdata(
  params: SibdataParams | null,
  opts: { enabled?: boolean } = {},
) {
  const enabled = opts.enabled !== false && params !== null && !!params.region;
  return useQuery({
    queryKey: ["sibdata", params],
    queryFn: async () => {
      const path = `/sibdata${qs(params as unknown as Record<string, QsValue>)}`;
      const raw = await fetchApi<unknown>(path);
      return assertTidyRows(raw, path);
    },
    enabled,
    staleTime: 5 * 60_000,
  });
}

export function useSibdataCount(
  params: Omit<SibdataParams, "n_especies"> | null,
  opts: { enabled?: boolean } = {},
) {
  const enabled = opts.enabled !== false && params !== null && !!params.region;
  return useQuery({
    queryKey: ["sibdata-count", params],
    queryFn: () =>
      fetchApi<{ count: number }>(`/sibdata${qs({ ...params, n_especies: true })}`),
    enabled,
    staleTime: 5 * 60_000,
  });
}

// ---- /api/tematicas/tree -------------------------------------------------

export function useTematicasTree() {
  return useQuery({
    queryKey: ["tematicas-tree"],
    queryFn: () => fetchApi<TematicaNode[]>("/tematicas/tree"),
    staleTime: Infinity,
  });
}

// ---- /api/grupos?tipo= ---------------------------------------------------

export interface GrupoOption {
  slug: string;
  label: string;
  parent?: string;
  level?: number;
}

export function useGrupos(tipo: GrupoTipo | null) {
  return useQuery({
    queryKey: ["grupos", tipo],
    queryFn: () => fetchApi<GrupoOption[]>(`/grupos?tipo=${tipo}`),
    staleTime: Infinity,
    enabled: tipo !== null,
  });
}

// ---- /api/regions --------------------------------------------------------

export function useExploradorRegions() {
  return useQuery({
    queryKey: ["regions"],
    queryFn: () => fetchApi<Region[]>("/regions"),
    staleTime: Infinity,
  });
}

// ---- /api/species --------------------------------------------------------

export interface SpeciesParams {
  region: string;
  grupo?: string | null;
  tematica?: string | null;
}

export function useSpecies(params: SpeciesParams | null) {
  const enabled = params !== null && !!params.region;
  return useQuery({
    queryKey: ["species", params],
    queryFn: () =>
      fetchApi<SpeciesRow[]>(`/species${qs(params as unknown as Record<string, QsValue>)}`),
    enabled,
    staleTime: 5 * 60_000,
  });
}

// ---- /api/labels ---------------------------------------------------------

export function useLabels(indicadores: string[]) {
  const sorted = [...indicadores].sort();
  const key = sorted.join(",");
  return useQuery({
    queryKey: ["labels", key],
    queryFn: () =>
      key === ""
        ? Promise.resolve({} as Record<string, string>)
        : fetchApi<Record<string, string>>(`/labels?indicadores=${encodeURIComponent(key)}`),
    enabled: sorted.length > 0,
    staleTime: Infinity,
  });
}
