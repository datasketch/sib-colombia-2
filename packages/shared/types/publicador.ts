/** publicador.tsv */
export interface Publicador {
  slug: string;
  label: string;
  pais_publicacion: string;
  tipo_organizacion: string;
  tipo_publicador: string;
  url_logo: string | null;
  url_socio: string | null;
  especies: number;
  registros: number;
}

/** region_publicador.tsv */
export interface RegionPublicador {
  slug_region: string;
  slug_publicador: string;
  registros: number;
  registros_continentales: number | null;
  registros_marinos: number | null;
  registros_salobres: number | null;
  especies: number;
  especies_continentales: number | null;
  especies_marinas: number | null;
  especies_salobres: number | null;
}
