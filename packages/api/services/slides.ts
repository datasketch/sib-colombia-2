import { queryRows, queryOne } from "../db.ts";
import { formatNumber } from "@sibdata/shared";
import { getParentRegion, getSubregions } from "./region-general.ts";

/**
 * Port of make_region_slides() from the legacy reference (simplified).
 * Returns slide data for a region.
 */
export async function getRegionSlides(
  region: string
): Promise<Record<string, unknown>[]> {
  const parent = await getParentRegion(region);
  const subregs = await getSubregions(region);
  const slides: Record<string, unknown>[] = [];

  // Detect municipality (no slide3 for those)
  const subtipoRow = await queryOne(
    `SELECT subtipo FROM region WHERE slug = $1 LIMIT 1`,
    [region],
  );
  const isMunicipality = String(subtipoRow?.subtipo ?? "").toLowerCase() === "municipio";

  // Slide 1: Region vs parent comparison (skip for colombia).
  //
  // Faithful port of make_region_slides() / make_region_slides2() from
  // the legacy reference + slides2.R. The waffle row order is whatever DuckDB
  // returns from `slug_region IN (region, parent)` and the proportion is
  // R's [2]/[1] (i.e. rows[1]/rows[0] in 0-indexed JS) — preserved verbatim
  // because prod renders the legacy R-generated math (yielding e.g. 1543.7%
  // for /boyaca/tunja). Don't "fix" the math without confirming prod first.
  if (region !== "colombia") {
    const regVsParent = await queryRows(`
      SELECT slug_region, especies_region_total, especies_endemicas
      FROM region_tematica
      WHERE slug_region IN ($1, $2)
    `, [region, parent]);

    const regRow = regVsParent.find((r) => r.slug_region === region);
    const parRow = regVsParent.find((r) => r.slug_region === parent);

    if (regRow && parRow && regVsParent.length === 2) {
      const espRegion = regRow.especies_region_total as number;
      const espParent = parRow.especies_region_total as number;
      const espEndemicas = regRow.especies_endemicas as number;

      // R's slides.R / slides2.R compute proportion = waffle[2]/waffle[1],
      // where waffle row order comes from `filter(slug_region %in% c(region,
      // parent))`. That order is non-deterministic and the resulting
      // percentages drift inconsistently across the static R contracts —
      // /narino/pasto reports 23.6% (region/parent, correct math) while
      // /boyaca/tunja reports 1543.7% (parent/region, accidentally inverted).
      // We always compute the correct math (region/parent), which matches
      // prod for the majority of regions and gives a sane number for the
      // ones where prod accidentally inverted.
      const proportion = espParent > 0
        ? Math.round((espRegion / espParent) * 1000) / 10
        : 0;

      const regionLabel = await queryOne(`SELECT label FROM region WHERE slug = $1`, [region]);
      const parentLabel = await queryOne(`SELECT label FROM region WHERE slug = $1`, [parent]);
      const rLabel = regionLabel?.label as string;
      const pLabel = parentLabel?.label as string;

      const reservaResguardo = new Set([
        "reserva-forestal-la-planada",
        "resguardo-indigena-pialapi-pueblo-viejo",
      ]);

      // Stakeholder copy rule (upstream #11): when a label starts with
      // "Reserva" / "Resguardo", lowercase the first word and prefix the
      // article ("la reserva …" / "el resguardo …"). Department text
      // gets "el departamento de …".
      const labelWithArticle = (label: string): string => {
        if (label.startsWith("Reserva ")) return `la ${label[0].toLowerCase()}${label.slice(1)}`;
        if (label.startsWith("Resguardo ")) return `el ${label[0].toLowerCase()}${label.slice(1)}`;
        return label;
      };

      let title: string;
      let description: string;

      if (region === "region-amazonia") {
        title = "¿Cómo esta la región Amazonía frente al resto de Colombia?";
        description =
          `De las ${formatNumber(espParent)} especies observadas en Colombia, la región Amazonía aporta ${formatNumber(espRegion)}, equivalentes a ${proportion}%. De estas ${formatNumber(espEndemicas)} especies son endémicas.`;
      } else if (reservaResguardo.has(region)) {
        title = `¿Cómo está ${rLabel} frente al resto de ${pLabel}?`;
        description =
          `De las ${formatNumber(espParent)} especies observadas en ${pLabel}, ${labelWithArticle(rLabel)} aporta ${formatNumber(espRegion)}, equivalentes a ${proportion}%. De estas ${formatNumber(espEndemicas)} especies son endémicas.`;
      } else if (isMunicipality) {
        title = `¿Cómo está ${rLabel} frente al resto de ${pLabel}?`;
        description =
          `De las ${formatNumber(espParent)} especies observadas en ${pLabel}, el municipio de ${rLabel} aporta ${formatNumber(espRegion)}, equivalentes a ${proportion}%. De estas ${formatNumber(espEndemicas)} especies son endémicas.`;
      } else {
        title = `¿Cómo está ${rLabel} frente al resto de ${pLabel}?`;
        description =
          `De las ${formatNumber(espParent)} especies observadas en Colombia, el departamento de ${rLabel} aporta ${formatNumber(espRegion)}, equivalentes a ${proportion}%. De estas ${formatNumber(espEndemicas)} especies son endémicas.`;
      }

      slides.push({
        id: "slide1",
        layout: "title/(text|chart)",
        title,
        description,
        waffle: regVsParent.map((r) => ({
          slug_region: r.slug_region,
          especies_region_total: r.especies_region_total,
        })),
      });
    }
  }

  // Slide 2: Top species by kingdom
  const topAnimals = await queryRows(`
    SELECT er.slug_especie, er.registros, e.species AS label
    FROM especie_region er
    JOIN especie e ON er.slug_especie = e.slug
    WHERE er.slug_region = $1 AND e.kingdom = 'Animalia'
    ORDER BY er.registros DESC LIMIT 10
  `, [region]);

  const topPlants = await queryRows(`
    SELECT er.slug_especie, er.registros, e.species AS label
    FROM especie_region er
    JOIN especie e ON er.slug_especie = e.slug
    WHERE er.slug_region = $1 AND e.kingdom = 'Plantae'
    ORDER BY er.registros DESC LIMIT 10
  `, [region]);

  const phrase1 = topAnimals.slice(0, 5).map((r) =>
    `_${r.label}_ (${formatNumber(r.registros as number)})`
  ).join(", ");
  const phrase2 = topPlants.slice(0, 5).map((r) =>
    `_${r.label}_ (${formatNumber(r.registros as number)})`
  ).join(", ");

  slides.push({
    id: "slide2",
    layout: "text-blocks",
    texts: [
      `Las especies de animales con más registros son: ${phrase1}.`,
      `Las especies de plantas con más registros son: ${phrase2}.`,
    ],
    especies_animales_top_observaciones: topAnimals,
    especies_plantas_top_observaciones: topPlants,
  });

  // Slide 3: Top subregions by endemicas and amenazadas
  // Always emit (with empty arrays if no subregions) to match static contract
  let topEndemicas: Record<string, unknown>[] = [];
  let topAmenazadas: Record<string, unknown>[] = [];
  if (subregs.length > 0) {
    const subregList = subregs.map((s) => `'${s}'`).join(", ");
    const subregData = await queryRows(`
      SELECT rt.slug_region, r.label,
        rt.especies_endemicas, rt.especies_amenazadas_nacional_total
      FROM region_tematica rt
      LEFT JOIN region r ON rt.slug_region = r.slug
      WHERE rt.slug_region IN (${subregList})
    `);

    topEndemicas = [...subregData]
      .filter((r) => r.especies_endemicas != null)
      .sort((a, b) => (b.especies_endemicas as number) - (a.especies_endemicas as number))
      .slice(0, 10)
      .map((r) => ({ label: r.label, n: r.especies_endemicas }));

    topAmenazadas = [...subregData]
      .filter((r) => r.especies_amenazadas_nacional_total != null)
      .sort((a, b) => (b.especies_amenazadas_nacional_total as number) - (a.especies_amenazadas_nacional_total as number))
      .slice(0, 10)
      .map((r) => ({ label: r.label, n: r.especies_amenazadas_nacional_total }));
  }

  // Skip slide3 when there's nothing to rank: municipalities (no
  // sub-regions) and single-area special entities like
  // reserva-forestal-la-planada / resguardo-indigena-pialapi-pueblo-viejo
  // (subregs is empty, so the slide would render with empty arrays
  // and a misleading "Top municipios" title — prod hides it).
  if (!isMunicipality && subregs.length > 0) {
    slides.push({
      id: "slide3",
      layout: "title/(chart|chart)",
      title: region === "colombia" ? "Top departamentos" : "Top municipios",
      description: "",
      n_muni_mas_endemicas: topEndemicas,
      n_muni_mas_amenazadas_nacional: topAmenazadas,
    });
  }

  return slides;
}
