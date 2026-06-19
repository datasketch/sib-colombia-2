/**
 * region_tematica.tsv — 260-column pivot table with all indicators per region.
 * We type this as a Record since the columns are too many to enumerate.
 * Known key columns are typed explicitly.
 */
export interface RegionTematica {
  slug_region: string;
  fecha_corte: string;
  especies_region_estimadas: number | null;
  estimada_region_ref_id: string | null;
  registros_region_total: number | null;
  especies_region_total: number | null;
  [indicator: string]: string | number | null | undefined;
}

/**
 * region_grupo.tsv — group-level indicators per region.
 * Has ~70 indicator columns plus slug_grupo, slug_region, tipo.
 */
export interface RegionGrupo {
  slug_grupo: string;
  slug_region: string;
  tipo: string;
  registros_region_total: number | null;
  especies_region_total: number | null;
  [indicator: string]: string | number | null | undefined;
}

/** ind_meta.csv */
export interface IndMeta {
  indicador: string;
  label: string;
  tipo: string;
  cobertura: string;
  slug_tematica: string;
  tematica: string;
  categorias_tematicas: string;
  descripcion: string;
  orden: string;
}
