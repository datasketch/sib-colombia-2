import type { TreeNode } from "./navigation.ts";
import type { Slide } from "./slides.ts";

/** Top-level JSON structure for a region (matches current {region}.json output) */
export interface RegionData {
  general_info: GeneralInfo;
  nav_tematica: TreeNode;
  nav_grupo_biologico: TreeNode;
  nav_grupo_interes: TreeNode;
  nav_territorio: TreeNode | TreeNode[];
  gallery: GalleryItem[];
  slides: Slide[];
  tematica: TematicaSection[];
  grupos_biologicos: GrupoData[];
  grupos_interes: GrupoData[];
  territorio: TerritorioSection[];
  patrocinador: PatrocinadorItem[];
  publicadores: PublicadoresData;
  municipios_lista: { slug: string; label: string }[];
  departamentos_lista: { slug: string; label: string }[];
}

export interface GeneralInfo {
  label: string;
  subtipo: string;
  especies_region_estimadas: number | null;
  especies_region_total: number;
  registros_region_total: number;
  registros_continentales: number | null;
  registros_marinos: number | null;
  especies_continentales: number | null;
  especies_marinas: number | null;
  marino: boolean;
  fecha_corte: string;
  main_text: string;
  referencia: string;
  credito_foto: string;
  parent?: string;
  parent_label?: string;
  [key: string]: unknown;
}

export interface GalleryItem {
  text: string;
  image: string;
  credit: string;
}

export interface TematicaSection {
  slug: string;
  label?: string;
  children?: TematicaChild[];
  [key: string]: unknown;
}

export interface TematicaChild {
  slug: string;
  label: string;
  especies?: number;
  registros?: number;
  species_list?: SpeciesListItem[];
  [key: string]: unknown;
}

export interface SpeciesListItem {
  label: string;
  slug_especie: string;
  registros: number;
  url_gbif: string | null;
  url_cbc: string | null;
  slug_tematica?: string;
}

export interface GrupoData {
  slug: string;
  slug_grupo: string;
  slug_region: string;
  label?: string;
  especies_region_total: number | null;
  registros_region_total: number | null;
  parent: { slug: string; label: string; especies_region_total: number; registros_region_total: number } | null;
  estimadas: Record<string, number | null>;
  subgrupo_especies: { slug_grupo: string; label_grupo: string; especies_region_total: number }[];
  species_list_top: SpeciesListItem[];
  species_list_tematica: Record<string, SpeciesListItem[]>;
  [key: string]: unknown;
}

export interface TerritorioSection {
  slug: string;
  label: string;
  title?: string;
  map_data?: unknown;
  charts?: unknown[];
}

export interface PatrocinadorItem {
  slug_region: string;
  slug_patrocinador: string;
  imagen?: string;
  titulo?: string;
  url?: string;
}

export interface PublicadoresData {
  publicadores_tipo: {
    tipo_organizacion: string;
    n_tipo: number;
    n_tipo_obs: number;
    pct_tipo: number;
    pct_tipo_obs: number;
  }[];
  publicadores_list: {
    slug_publicador: string;
    registros: number;
    especies: number;
    label: string;
    pais_publicacion: string;
    url_logo: string | null;
    url_socio: string | null;
  }[];
}

export interface HomeData {
  lista_mapa: {
    country_ranking: { puesto: number; pais: string; lat?: number; lon?: number }[];
    ref_principal: string;
  };
  destacados_regiones: {
    slug_region: string;
    label_region: string;
    especies_total: number;
    especies_estimadas: number | null;
    observadas: number;
  }[];
}
