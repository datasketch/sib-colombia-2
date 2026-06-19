export type ChartType =
  | "map"
  | "cards"
  | "pie"
  | "donut"
  | "bar"
  | "treemap";

export type Tipo = "registros" | "especies";

export type GrupoTipo = "biologico" | "interes";

export type RegionTipo = "Nacional" | "Departamentos" | "Especial";

export type AmenazadasCategoria = "_total" | "_en" | "_cr" | "_vu";

/**
 * Mirrors the `reactiveValues` bag in
 * the legacy reference Field names kept 1:1
 * with the R side so the pure-function ports stay mechanical.
 */
export interface FilterState {
  region: string | null;
  regionTipo: RegionTipo | null;
  /** null = neither parent radio selected (initial state in app4). */
  grupoTipo: GrupoTipo | null;
  grupo: string | null;
  tematica: string | null;
  subtematica: string | null;
  amenazadasCategoria: AmenazadasCategoria | null;
  tipo: Tipo;
  chartType: ChartType;
}

export interface SibdataRow {
  slug_region: string;
  label_region: string;
  label: string;
  indicador: string;
  /** null = "no data for this indicator in this filter combo" (distinct from 0). */
  count: number | null;
  grupo?: string;
  cod_dane?: string;
}

export interface SpeciesRow {
  slug_especie: string;
  especie: string;
  observaciones: number;
  tematica_label?: string;
  vernacular_name_es?: string;
  url_gbif: string;
  url_cbc: string;
  reino: string;
  filo: string;
  clase: string;
  orden: string;
  familia: string;
  genero: string;
}

export interface TematicaNode {
  slug: string;
  label: string;
  tooltip?: string;
  descripcion?: string;
  children?: TematicaNode[];
}
