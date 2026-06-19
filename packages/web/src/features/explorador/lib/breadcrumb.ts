import type { FilterState } from "../types.ts";

function titleCase(s: string): string {
  return s
    .split(/\s+/)
    .map((w) => (w.length === 0 ? w : w[0].toUpperCase() + w.slice(1).toLowerCase()))
    .join(" ");
}

/**
 * Port of `create_breadcrumb_viz()` at R/exp_viz_inputs.R:245-282.
 * Produces the chart-title text shown above the viz panel.
 */
export function createBreadcrumb(s: FilterState): string {
  const region = s.region ? titleCase(s.region.replace(/-/g, " ")) : "";
  const tipoText = s.tipo === "registros" ? "Observaciones" : "Especies";

  const t = s.tematica ? s.tematica.replace(/-/g, "_") : null;

  let tematicaText: string;
  if (!s.tematica) {
    tematicaText = "todas las temáticas";
  } else if (s.subtematica && s.subtematica !== "") {
    if (s.subtematica === "cites") {
      tematicaText = "CITES";
    } else if (s.subtematica.startsWith("cites-")) {
      const suffix = s.subtematica.replace(/^cites-/, "");
      // Preserve the I-II hyphen on the compound CITES I-II label.
      tematicaText = `CITES ${suffix.toUpperCase()}`;
    } else {
      tematicaText = titleCase(s.subtematica.replace(/-/g, " "));
    }
  } else if (
    s.amenazadasCategoria &&
    s.amenazadasCategoria !== "_total" &&
    t &&
    t.includes("amenazadas")
  ) {
    const scope = t.includes("global")
      ? "categoría global"
      : t.includes("nacional")
        ? "categoría nacional"
        : "";
    const subLab = s.amenazadasCategoria.replace(/^_/, "").toUpperCase();
    tematicaText = `${subLab} ${scope}`.trim();
  } else {
    const slug = t ?? (s.tematica ? s.tematica.replace(/-/g, "_") : "");
    if (slug === "cites") tematicaText = "CITES";
    else tematicaText = titleCase(slug.replace(/_/g, " "));
  }

  const grupoText = s.grupo ? `del grupo ${titleCase(s.grupo.replace(/-/g, " "))}` : "";
  return [tipoText, "para", tematicaText, "en", region, grupoText]
    .filter((x) => x !== "")
    .join(" ");
}
