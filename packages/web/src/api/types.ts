/**
 * Types matching the Hono API responses.
 * In a true monorepo we'd import from @sibdata/shared, but the web package
 * runs through Vite (not Deno) so we redefine the public-facing shapes here.
 */

export interface TreeNode {
  slug: string;
  label?: string;
  icon_white?: string;
  icon_black?: string;
  children?: TreeNode[];
  [key: string]: unknown;
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
  especies_region_total_str: string;
  registros_region_total_str: string;
}

export interface SpeciesListItem {
  slug_especie: string;
  registros: number;
  label: string;
  url_gbif: string | null;
  url_cbc: string | null;
  slug_tematica?: string;
}

export interface TematicaSection {
  slug: string;
  label?: string;
  children?: Array<{
    slug: string;
    label: string;
    especies?: number;
    registros?: number;
    species_list?: SpeciesListItem[];
  }>;
  species_list?: SpeciesListItem[];
  [key: string]: unknown;
}

export interface GalleryItem {
  text: string;
  image: string;
  credit: string;
}

export interface Slide {
  id: string;
  layout: string;
  title?: string;
  description?: string;
  texts?: string[];
  waffle?: { slug_region: string; especies_region_total: number }[];
  [key: string]: unknown;
}

export interface RegionData {
  general_info: GeneralInfo;
  gallery: GalleryItem[];
  slides: Slide[];
  tematica: TematicaSection[];
  grupos_biologicos: Record<string, unknown>[];
  grupos_interes: Record<string, unknown>[];
  territorio: unknown[];
  patrocinador: unknown[];
  publicadores: {
    publicadores_tipo: unknown[];
    publicadores_list: unknown[];
  };
  municipios_lista: { slug: string; label: string }[];
  departamentos_lista: { slug: string; label: string }[];
}

export interface HomeData {
  lista_mapa: {
    country_ranking: { puesto: number; pais: string; ref_id: string }[];
    ref_principal: string;
  };
  colombia: {
    slug_region: string;
    label_region: string;
    especies_total: number;
    especies_estimadas: number;
    observadas: number;
  };
  destacados_regiones: {
    slug_region: string;
    label_region: string;
    especies_total: number;
    especies_estimadas: number | null;
    observadas: number;
  }[];
  _warnings?: {
    shape_drift?: {
      failed: number;
      contracts: number;
      total_diffs: number;
      run_at?: string;
    };
  };
}

export interface Region {
  slug: string;
  label: string;
  tipo: string;
  subtipo: string;
  parent: string | null;
}

export interface GlossaryItem {
  termino: string;
  definicion: string;
  fuente?: string;
}

export interface FAQItem {
  pregunta: string;
  respuesta: string;
}

export interface Publisher {
  slug_region: string;
  slug_publicador: string;
  registros: number;
  especies: number;
  label: string;
  pais_publicacion: string | null;
  tipo_organizacion: string | null;
  tipo_publicador: string | null;
  url_logo: string | null;
  url_socio: string | null;
}

export interface PublisherFilters {
  tipo_organizacion: string[];
  pais_publicacion: string[];
  region: string[];
}
