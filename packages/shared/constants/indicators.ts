/**
 * Default indicator maps — port of default_indicadores() from
 * the legacy reference
 *
 * Keys are aliases used in the JSON output, values are column names
 * from the region_tematica table.
 */

export const DEFAULT_INDICATORS: Record<string, Record<string, string>> = {
  inds_amenazadas_nacional: {
    especies: "especies_amenazadas_nacional_total",
    registros: "registros_amenazadas_nacional_total",
    cr: "especies_amenazadas_nacional_cr",
    cr_registros: "registros_amenazadas_nacional_cr",
    en: "especies_amenazadas_nacional_en",
    en_registros: "registros_amenazadas_nacional_en",
    vu: "especies_amenazadas_nacional_vu",
    vu_registros: "registros_amenazadas_nacional_vu",
    especies_estimadas: "especies_region_estimadas",
  },
  parent_inds_amenazadas_nacional: {
    parent_especies_est: "especies_region_estimadas",
    parent_cr: "especies_amenazadas_nacional_cr",
    parent_en: "especies_amenazadas_nacional_en",
    parent_vu: "especies_amenazadas_nacional_vu",
  },
  inds_amenazadas_global: {
    especies: "especies_amenazadas_global_total",
    registros: "registros_amenazadas_global_total",
    cr: "especies_amenazadas_global_cr",
    cr_registros: "registros_amenazadas_global_cr",
    en: "especies_amenazadas_global_en",
    en_registros: "registros_amenazadas_global_en",
    vu: "especies_amenazadas_global_vu",
    vu_registros: "registros_amenazadas_global_vu",
    especies_estimadas: "especies_region_estimadas",
  },
  parent_inds_amenazadas_global: {
    parent_especies_est: "especies_region_estimadas",
    parent_cr: "especies_amenazadas_global_cr",
    parent_en: "especies_amenazadas_global_en",
    parent_vu: "especies_amenazadas_global_vu",
  },
  inds_especies_est: {
    especies_total: "especies_region_total",
  },
  inds_especies_parent_total: {
    parent_especies_total: "especies_region_total",
  },
  inds_cites: {
    especies_cites_total: "especies_cites_total",
    especies_cites_i: "especies_cites_i",
    especies_cites_ii: "especies_cites_ii",
    especies_cites_i_ii: "especies_cites_i_ii",
    especies_cites_iii: "especies_cites_iii",
    registros_cites_total: "registros_cites_total",
    registros_cites_i: "registros_cites_i",
    registros_cites_ii: "registros_cites_ii",
    registros_cites_i_ii: "registros_cites_i_ii",
    registros_cites_iii: "registros_cites_iii",
  },
  inds_parent_cites: {
    parent_especies_cites_total: "especies_cites_total",
    parent_especies_cites_i: "especies_cites_i",
    parent_especies_cites_ii: "especies_cites_ii",
    parent_especies_cites_i_ii: "especies_cites_i_ii",
    parent_especies_cites_iii: "especies_cites_iii",
    parent_registros_cites_total: "registros_cites_total",
    parent_registros_cites_i: "registros_cites_i",
    parent_registros_cites_ii: "registros_cites_ii",
    parent_registros_cites_i_ii: "registros_cites_i_ii",
    parent_registros_cites_iii: "registros_cites_iii",
  },
  inds_endemicas: {
    especies_endemicas: "especies_endemicas",
    registros_endemicas: "registros_endemicas",
  },
  inds_parent_endemicas: {
    parent_especies_endemicas: "especies_endemicas",
    parent_registros_endemicas: "registros_endemicas",
  },
  inds_migratorias: {
    especies_migratorias: "especies_migratorias",
    registros_migratorias: "registros_migratorias",
  },
  inds_parent_migratorias: {
    parent_especies_migratorias: "especies_migratorias",
    parent_registros_migratorias: "registros_migratorias",
  },
  inds_exoticas: {
    especies_exoticas_total: "especies_exoticas_total",
    especies_exoticas: "especies_exoticas",
    especies_invasoras: "especies_invasoras",
    especies_exoticas_riesgo_invasion_total: "especies_exoticas_riesgo_invasion_total",
    especies_trasplantadas: "especies_trasplantadas",
    registros_exoticas_total: "registros_exoticas_total",
    registros_exoticas: "registros_exoticas",
    registros_invasoras: "registros_invasoras",
    registros_exoticas_riesgo_invasion_total: "registros_exoticas_riesgo_invasion_total",
    registros_trasplantadas: "registros_trasplantadas",
  },
  inds_parent_exoticas: {
    parent_especies_exoticas_total: "especies_exoticas_total",
    parent_especies_exoticas: "especies_exoticas",
    parent_especies_invasoras: "especies_invasoras",
    parent_especies_exoticas_riesgo_invasion_total: "especies_exoticas_riesgo_invasion_total",
    parent_especies_trasplantadas: "especies_trasplantadas",
    parent_registros_exoticas_total: "registros_exoticas_total",
    parent_registros_exoticas: "registros_exoticas",
    parent_registros_invasoras: "registros_invasoras",
    parent_registros_exoticas_riesgo_invasion_total: "registros_exoticas_riesgo_invasion_total",
    parent_registros_trasplantadas: "registros_trasplantadas",
  },
};
