/** especie.tsv */
export interface Especie {
  slug: string;
  species: string;
  kingdom: string;
  phylum: string;
  class: string;
  order: string;
  family: string;
  genus: string;
}

/** especie_region.tsv */
export interface EspecieRegion {
  slug_region: string;
  slug_especie: string;
  registros: number;
}

/** especie_grupo.tsv */
export interface EspecieGrupo {
  slug_especie: string;
  slug_grupo: string;
  tipo: string;
}

/** especie_tematica.tsv */
export interface EspecieTematica {
  slug_especie: string;
  slug_region: string;
  slug_tematica: string;
}

/** especie_meta.tsv */
export interface EspecieMeta {
  slug: string;
  vernacular_name_es: string | null;
  url_gbif: string | null;
  url_cbc: string | null;
  flagTAXO: string | null;
}
