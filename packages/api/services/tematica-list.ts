import { queryRows } from "../db.ts";
import { getRegionIndicators } from "./indicators.ts";
import { listSpecies } from "./species-list.ts";
import { getParentRegion } from "./region-general.ts";

/**
 * Port of tematica_list() / tematica_list_col() from the legacy reference
 * Assembles the 7 tematica sections with indicators + top species lists.
 */
export async function getTematicaList(
  region: string
): Promise<Record<string, unknown>[]> {
  let parentRegion = await getParentRegion(region);
  // Núcleos (NDFyB) hang off the "nucleos-dfyb" aggregate, which carries no
  // national parent indicators — so the temática "a nivel país" comparison
  // bars (endémicas/migratorias/CITES/amenazadas) came back empty for them and
  // fell back to the estimated total, mislabeled as "Especies Colombia"
  // (#37 — Núcleos). They compare against the country, like region-amazonia
  // already does, so resolve their comparison parent to colombia.
  if (region.startsWith("nucleos-dfyb")) parentRegion = "colombia";
  const isCol = region === "colombia";

  // Estimadas totals
  const estimadasRows = await queryRows(
    `SELECT * FROM estimada WHERE slug_grupo = 'total'`
  );
  const estimadas = estimadasRows[0] ?? {};

  // --- Amenazadas ---
  const espNacional = await listSpecies(region, { tematica: "amenazadas-nacional", keepTies: false });
  const espGlobal = await listSpecies(region, { tematica: "amenazadas-global", keepTies: false });

  const amenazadas = {
    slug: "amenazadas",
    label: "Amenazadas",
    children: [
      {
        slug: "amenazadas-nacional",
        label: "Amenazadas nacional",
        ...await getRegionIndicators(region, "inds_amenazadas_nacional"),
        species_list: espNacional,
      },
      {
        slug: "amenazadas-global",
        label: "Amenazadas global",
        ...await getRegionIndicators(region, "inds_amenazadas_global"),
        species_list: espGlobal,
      },
    ],
  };

  // --- Amenazadas Nacional detail ---
  const amenazadasNacional = {
    slug: "amenazadas-nacional",
    label: "Amenazadas nacional",
    parent_cr_estimadas: estimadas.especies_amenazadas_nacional_cr_estimadas,
    parent_en_estimadas: estimadas.especies_amenazadas_nacional_en_estimadas,
    parent_vu_estimadas: estimadas.especies_amenazadas_nacional_vu_estimadas,
    ...await getRegionIndicators(region, "inds_amenazadas_nacional"),
    ...(!isCol ? await getRegionIndicators(parentRegion, "parent_inds_amenazadas_nacional") : {}),
    ...(!isCol ? await getRegionIndicators(parentRegion, "inds_especies_parent_total") : await getRegionIndicators(region, "inds_especies_est")),
    list_especies_amenazadas_nacional: espNacional,
    list_especies_amenazadas_nacional_vu: await listSpecies(region, { tematica: "amenazadas-nacional-vu", keepTies: false }),
    list_especies_amenazadas_nacional_en: await listSpecies(region, { tematica: "amenazadas-nacional-en", keepTies: false }),
    list_especies_amenazadas_nacional_cr: await listSpecies(region, { tematica: "amenazadas-nacional-cr", keepTies: false }),
  };

  // --- Amenazadas Global detail ---
  const amenazadasGlobal = {
    slug: "amenazadas-global",
    label: "Amenazadas global",
    cr_estimadas: estimadas.especies_amenazadas_global_cr_estimadas,
    en_estimadas: estimadas.especies_amenazadas_global_en_estimadas,
    vu_estimadas: estimadas.especies_amenazadas_global_vu_estimadas,
    ...await getRegionIndicators(region, "inds_amenazadas_global"),
    ...(!isCol ? await getRegionIndicators(parentRegion, "parent_inds_amenazadas_global") : {}),
    ...(!isCol ? await getRegionIndicators(parentRegion, "inds_especies_parent_total") : await getRegionIndicators(region, "inds_especies_est")),
    list_especies_amenazadas_global: espGlobal,
    list_especies_amenazadas_global_vu: await listSpecies(region, { tematica: "amenazadas-global-vu", keepTies: false }),
    list_especies_amenazadas_global_en: await listSpecies(region, { tematica: "amenazadas-global-en", keepTies: false }),
    list_especies_amenazadas_global_cr: await listSpecies(region, { tematica: "amenazadas-global-cr", keepTies: false }),
  };

  // --- CITES ---
  const cites = {
    slug: "cites",
    cites_total_estimadas: estimadas.especies_cites_total_estimadas,
    cites_i_estimadas: estimadas.especies_cites_i_estimadas,
    cites_i_ii_estimadas: estimadas.especies_cites_i_ii_estimadas,
    cites_ii_estimadas: estimadas.especies_cites_ii_estimadas,
    cites_iii_estimadas: estimadas.especies_cites_iii_estimadas,
    ...await getRegionIndicators(region, "inds_cites"),
    ...await getRegionIndicators(parentRegion, "inds_parent_cites"),
    list_especies_cites: await listSpecies(region, { tematica: "cites", keepTies: false }),
    list_especies_cites_i: await listSpecies(region, { tematica: "cites-i", keepTies: false }),
    list_especies_cites_i_ii: await listSpecies(region, { tematica: "cites-i_ii", keepTies: false }),
    list_especies_cites_ii: await listSpecies(region, { tematica: "cites-ii", keepTies: false }),
    list_especies_cites_iii: await listSpecies(region, { tematica: "cites-iii", keepTies: false }),
    species_list: await listSpecies(region, { tematica: "cites", keepTies: false }),
  };

  // --- Endémicas ---
  const endemicas = {
    slug: "endemicas",
    endemicas_estimadas: estimadas.especies_endemicas_estimadas,
    ...await getRegionIndicators(region, "inds_endemicas"),
    ...await getRegionIndicators(parentRegion, "inds_parent_endemicas"),
    list_especies_endemicas: null,
    species_list: await listSpecies(region, { tematica: "endemicas", keepTies: false }),
  };

  // --- Migratorias ---
  const migratorias = {
    slug: "migratorias",
    texto: "La información de especies migratorias se basa en la Lista de referencia de especies silvestres migratorias de la diversidad biológica continental y marino- costera de Colombia consolidada por el Ministerio de Ambiente y Desarrollo Sostenible conjuntamente con el apoyo de WWF Colombia, expertos y especialistas, academia a nivel nacional e instituciones del Sistema Nacional Ambiental – SINA",
    migratorias_estimadas: estimadas.especies_migratorias_estimadas,
    ...await getRegionIndicators(region, "inds_migratorias"),
    ...await getRegionIndicators(parentRegion, "inds_parent_migratorias"),
    species_list: await listSpecies(region, { tematica: "migratorias", keepTies: false }),
  };

  // --- Exóticas ---
  const exoticas = {
    slug: "exoticas-total",
    exoticas_total_estimadas: estimadas.especies_exoticas_total_estimadas,
    exoticas_estimadas: estimadas.especies_exoticas_estimadas,
    exoticas_riesgo_invasion_estimadas: estimadas.especies_exoticas_riesgo_invasion_estimadas,
    exoticas_invasoras_estimadas: estimadas.especies_invasoras_estimadas,
    exoticas_trasplantadas_estimadas: estimadas.especies_trasplantadas_estimadas,
    ...await getRegionIndicators(region, "inds_exoticas"),
    ...await getRegionIndicators(parentRegion, "inds_parent_exoticas"),
    list_especies_exoticas_total: await listSpecies(region, { tematica: "exoticas-total", keepTies: false }),
    list_especies_exoticas: await listSpecies(region, { tematica: "exoticas", keepTies: false }),
    list_especies_invasoras: await listSpecies(region, { tematica: "invasoras", keepTies: false }),
    list_especies_exoticas_riesgo_invasion_total: await listSpecies(region, { tematica: "exoticas-riesgo-invasion-total", keepTies: false }),
    list_especies_trasplantadas: await listSpecies(region, { tematica: "trasplantadas", keepTies: false }),
  };

  return [amenazadas, amenazadasNacional, amenazadasGlobal, cites, endemicas, migratorias, exoticas];
}
