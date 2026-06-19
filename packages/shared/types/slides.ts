/** Slide data — discriminated by layout field */
export interface SlideWaffle {
  id: string;
  layout: "title/(text|chart)";
  title: string;
  description: string;
  waffle: { slug_region: string; especies_region_total: number }[];
}

export interface SlideTextBlocks {
  id: string;
  layout: "text-blocks";
  texts: string[];
  especies_animales_top_observaciones: SpeciesObservation[];
  especies_plantas_top_observaciones: SpeciesObservation[];
}

export interface SlideTopMunicipios {
  id: string;
  layout: "title/(chart|chart)";
  title: string;
  description: string;
  n_muni_mas_endemicas: { label: string; n: number }[];
  n_muni_mas_amenazadas_nacional: { label: string; n: number }[];
}

export type Slide = SlideWaffle | SlideTextBlocks | SlideTopMunicipios;

export interface SpeciesObservation {
  slug_especie: string;
  registros: number;
  species: string;
  label: string;
  registros_str: string;
  [key: string]: unknown;
}
