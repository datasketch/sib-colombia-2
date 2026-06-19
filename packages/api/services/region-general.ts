import { queryOne, queryRows } from "../db.ts";
import { formatNumber, formatDate, interpolate } from "@sibdata/shared";

/**
 * Port of sib_region_general() from the legacy reference
 */
export async function getRegionGeneral(
  region: string
): Promise<Record<string, unknown>> {
  // Get region + region_tematica + marine info
  const reg = await queryOne(`
    SELECT r.slug, r.label, r.subtipo, r.parent,
      rt.especies_region_estimadas, rt.especies_region_total,
      rt.registros_region_total, rt.registros_continentales, rt.registros_marinos,
      rt.especies_continentales, rt.especies_marinas,
      rt.fecha_corte, rt.estimada_region_ref_id
    FROM region r
    LEFT JOIN region_tematica rt ON r.slug = rt.slug_region
    WHERE r.slug = $1
  `, [region]);

  if (!reg) throw new Error(`Region not found: ${region}`);

  // Get marino flag from departamento or municipio table
  let marino = false;
  const depto = await queryOne(
    `SELECT marino FROM departamento WHERE slug = $1`, [region]
  );
  if (depto) {
    marino = depto.marino === "TRUE" || depto.marino === true;
  } else {
    const muni = await queryOne(
      `SELECT marino FROM municipio WHERE slug = $1`, [region]
    );
    if (muni) marino = muni.marino === "TRUE" || muni.marino === true;
  }
  if (region === "colombia") marino = true;

  // Special label overrides
  let label = reg.label as string;
  if (region === "reserva-forestal-la-planada") label = "La Planada";
  if (region === "resguardo-indigena-pialapi-pueblo-viejo") label = "Pialapí Pueblo-Viejo";

  const subtipo = (reg.subtipo as string ?? "").toLowerCase();
  const fechaCorte = formatDate(reg.fecha_corte as string, "diciembre 12 de 2030");

  const especiesTotalStr = formatNumber(reg.especies_region_total as number);
  const registrosTotalStr = formatNumber(reg.registros_region_total as number);
  const especiesMarinas = formatNumber(reg.especies_marinas as number);
  const especiesContinentales = formatNumber(reg.especies_continentales as number);

  // Build main text
  let marinoText = ".";
  if (marino) {
    marinoText = `; de las cuales ${especiesContinentales} habitan al interior del continente y ${especiesMarinas} en el mar.`;
  }

  const tplData = {
    registros_region_total_str: registrosTotalStr,
    especies_region_total_str: especiesTotalStr,
    subtipo,
    label,
    fecha_corte: fechaCorte,
    marino_text: marinoText,
  };

  let mainText: string;
  if (region === "colombia") {
    mainText = interpolate(
      "A {fecha_corte}, se han publicado {registros_region_total_str} observaciones a través del SiB Colombia. Estos datos respaldan la existencia de {especies_region_total_str} especies en el territorio nacional{marino_text}",
      tplData
    );
  } else if (region === "region-amazonia") {
    mainText = interpolate(
      "A través del SiB Colombia se han publicado {registros_region_total_str} observaciones para la región natural de la Amazonía. Estos datos hacen referencia a un total de {especies_region_total_str} especies{marino_text}",
      tplData
    );
  } else if (region.startsWith("nucleos-dfyb")) {
    // Núcleos (NDFyB): the subtipo ("ndfyb") is already baked into the label
    // ("NDFyB Agua Bonita"), so the generic "para el {subtipo} de {label}"
    // reads "para el ndfyb de NDFyB Agua Bonita". Use the label alone — but
    // spell out the "NDFyB" sigla in the descriptive sentence (#36). Only the
    // leading acronym is expanded; the specific núcleo name (e.g. "Agua
    // Bonita") and the h1 title keep the short form. The parent window's label
    // already starts with "Núcleos de Desarrollo…", so it is left untouched.
    const labelDesc = label.replace(
      /^NDFyB\b/,
      "Núcleo de Desarrollo Forestal y de la Biodiversidad (NDFyB)"
    );
    mainText = interpolate(
      "A través del SiB Colombia se han publicado {registros_region_total_str} observaciones para el {label}. Estos datos hacen referencia a un total de {especies_region_total_str} especies{marino_text}",
      { ...tplData, label: labelDesc }
    );
  } else {
    mainText = interpolate(
      "A través del SiB Colombia se han publicado {registros_region_total_str} observaciones para el {subtipo} de {label}. Estos datos hacen referencia a un total de {especies_region_total_str} especies{marino_text}",
      tplData
    );
  }

  // Reference
  const refId = reg.estimada_region_ref_id;
  const ref = refId
    ? await queryOne(
        `SELECT label FROM referencia_estimada WHERE CAST(ref_id AS VARCHAR) = $1`,
        [String(refId)]
      )
    : null;

  // Parent region (for waffle legend, banner SVG, etc.)
  // Matches the legacy R contract — `general_info.parent` /
  // `parent_label`. Use the same getParentRegion override that handles
  // region-amazonia, reserva, resguardo, etc.
  const parent = await getParentRegion(region);
  const parentRow = parent
    ? await queryOne(`SELECT label FROM region WHERE slug = $1`, [parent])
    : null;
  const parentLabel = (parentRow?.label as string | undefined) ?? null;

  // Banner photo credit
  let creditRegion = region;
  if (["boyaca", "narino", "santander", "tolima"].includes(parent)) {
    creditRegion = parent;
  }
  const banner = await queryOne(
    `SELECT credito FROM banner_images WHERE slug = $1`, [creditRegion]
  );

  return {
    label,
    subtipo,
    parent,
    parent_label: parentLabel,
    especies_region_estimadas: reg.especies_region_estimadas,
    especies_region_total: reg.especies_region_total,
    registros_region_total: reg.registros_region_total,
    registros_continentales: reg.registros_continentales,
    registros_marinos: reg.registros_marinos,
    especies_continentales: reg.especies_continentales,
    especies_marinas: reg.especies_marinas,
    marino,
    fecha_corte: fechaCorte,
    main_text: mainText,
    // The R-side static files use [] for missing optional fields
    referencia: ref?.label ?? [],
    credito_foto: banner?.credito ?? [],
    especies_region_total_str: especiesTotalStr,
    registros_region_total_str: registrosTotalStr,
  };
}

/**
 * Get the parent region slug.
 *
 * Faithful port of sib_parent_region() from the legacy reference: special
 * regions don't use their DB parent (which is a container slug like
 * `territorios-indigenas` that has no row in `region_tematica`). The
 * R reference remaps them so per-region comparisons fall back to a
 * meaningful parent that has aggregate data.
 */
export async function getParentRegion(region: string): Promise<string> {
  if (region === "region-amazonia") return "colombia";
  if (
    region === "reserva-forestal-la-planada" ||
    region === "resguardo-indigena-pialapi-pueblo-viejo"
  ) {
    return "narino";
  }
  const row = await queryOne(
    `SELECT parent FROM region WHERE slug = $1`, [region]
  );
  const dbParent = (row?.parent as string) ?? "colombia";
  if (dbParent === "regiones-naturales") return "colombia";
  return dbParent;
}

/** Return true if the region slug exists in the `region` table. */
export async function regionExists(region: string): Promise<boolean> {
  const row = await queryOne(
    `SELECT 1 AS n FROM region WHERE slug = $1 LIMIT 1`,
    [region],
  );
  return row != null;
}

/** Get available subregions */
export async function getSubregions(region: string): Promise<string[]> {
  const rows = await queryRows(
    `SELECT slug FROM region WHERE parent = $1`, [region]
  );
  const slugs = rows.map((r) => r.slug as string);
  // bogota-dc special case
  if (region === "colombia" && !slugs.includes("bogota-dc")) {
    slugs.push("bogota-dc");
  }
  return slugs;
}
