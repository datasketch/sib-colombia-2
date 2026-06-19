import { create } from "zustand";
import type {
  AmenazadasCategoria,
  ChartType,
  FilterState,
  GrupoTipo,
  Tipo,
} from "./types";
import { deriveAmenazadasSubtematica } from "./lib/indicador";

interface Actions {
  setRegion: (region: string | null) => void;
  setGrupoTipo: (g: GrupoTipo | null) => void;
  setGrupo: (g: string | null) => void;
  setTipo: (t: Tipo) => void;
  setChartType: (c: ChartType) => void;
  setTematica: (t: string | null, subtematica?: string | null) => void;
  setSubtematica: (s: string | null) => void;
  setAmenazadasCategoria: (c: AmenazadasCategoria | null) => void;
  clearTematica: () => void;
  /** Replace full state — used by the URL-sync effect on mount. */
  hydrate: (patch: Partial<FilterState>) => void;
}

const INITIAL: FilterState = {
  region: "colombia",
  regionTipo: "Nacional",
  grupoTipo: null,
  grupo: null,
  tematica: null,
  subtematica: null,
  amenazadasCategoria: null,
  tipo: "registros",
  chartType: "map",
};

/** "todos" and "todas" sentinels become `null` at the store boundary. */
function normalize(value: string | null): string | null {
  if (value === null || value === "") return null;
  const lower = value.toLowerCase();
  if (lower === "todos" || lower === "todas") return null;
  return value;
}

export const useExploradorStore = create<FilterState & Actions>((set, get) => ({
  ...INITIAL,

  // `map` is always available now (choropleth or locator), so a region
  // change can't invalidate chartType — no reconciliation needed here.
  setRegion: (region) => set({ region: normalize(region) }),
  setGrupoTipo: (grupoTipo) => set({ grupoTipo, grupo: null }),
  // Note: passing null clears the parent radio so neither Biológico nor
  // Interés de Conservación is selected — matches app4's load state.
  setGrupo: (grupo) => set({ grupo: normalize(grupo) }),
  setTipo: (tipo) => set({ tipo }),
  setChartType: (chartType) => set({ chartType }),

  setTematica: (tematica, subtematica = null) => {
    const norm = normalize(tematica);
    set({
      tematica: norm,
      subtematica: subtematica ?? null,
      // Default amenazadas to _total when the parent is one of the two
      // amenazadas leaves; clear it otherwise.
      amenazadasCategoria:
        norm === "amenazadas-global" || norm === "amenazadas-nacional" ? "_total" : null,
    });
  },

  setSubtematica: (subtematica) => set({ subtematica }),

  setAmenazadasCategoria: (amenazadasCategoria) => {
    const s = get();
    const sub = deriveAmenazadasSubtematica(s.tematica, amenazadasCategoria);
    set({ amenazadasCategoria, subtematica: sub });
  },

  clearTematica: () =>
    set({
      tematica: null,
      subtematica: null,
      amenazadasCategoria: null,
    }),

  hydrate: (patch) => set(patch),
}));
