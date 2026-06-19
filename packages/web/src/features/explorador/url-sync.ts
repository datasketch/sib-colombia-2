import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import type {
  AmenazadasCategoria,
  ChartType,
  FilterState,
  GrupoTipo,
  Tipo,
} from "./types";
import { useExploradorStore } from "./store";
import { useGrupos } from "./api";

const VALID_CHARTS: ReadonlySet<ChartType> = new Set([
  "map",
  "cards",
  "pie",
  "donut",
  "bar",
  "treemap",
]);

const VALID_TIPO: ReadonlySet<Tipo> = new Set(["registros", "especies"]);
const VALID_GRUPO_TIPO: ReadonlySet<GrupoTipo> = new Set(["biologico", "interes"]);
const VALID_AMEN: ReadonlySet<AmenazadasCategoria> = new Set(["_total", "_en", "_cr", "_vu"]);

/**
 * Many legacy linkers — the `components-legacy/CardTematicas{,Col}.jsx`
 * "Explora lista completa" links, the cifras-page Top-10 tooltips,
 * external blog posts, etc. — emit a single `?tematica=<deep-slug>`
 * shape (e.g. `amenazadas-global-cr`, `cites-i`, `invasoras`) instead
 * of the canonical `tematica=<root>&subtematica=<leaf>&amenazadasCategoria=_cr`
 * triplet that the explorer actually wires through to the cards / map /
 * species panel.
 *
 * This normalizer accepts the legacy form and explodes it. Explicit
 * params on the URL still win, so a linker that updates to the new
 * shape immediately works without removing the deep-slug fallback.
 */
function normalizeTematicaUrl(slug: string): {
  tematica: string | null;
  subtematica?: string | null;
  amenazadasCategoria?: AmenazadasCategoria | null;
} {
  // amenazadas-{global,nacional}-{cr,en,vu}
  const amenLeaf = slug.match(/^(amenazadas-(?:global|nacional))-(cr|en|vu)$/);
  if (amenLeaf) {
    return {
      tematica: amenLeaf[1],
      subtematica: slug,
      amenazadasCategoria: `_${amenLeaf[2]}` as AmenazadasCategoria,
    };
  }
  // amenazadas-global / amenazadas-nacional roots — default to _total so
  // the explorer renders the parent radio + Total amenazadas selected.
  if (slug === "amenazadas-global" || slug === "amenazadas-nacional") {
    return { tematica: slug, subtematica: null, amenazadasCategoria: "_total" };
  }
  // CITES leaves: cites-i, cites-ii, cites-iii, cites-i-ii
  if (/^cites-(i|ii|iii|i-ii)$/.test(slug)) {
    return { tematica: "cites", subtematica: slug };
  }
  // Exoticas-total leaves
  if (
    slug === "invasoras" ||
    slug === "trasplantadas" ||
    slug === "exoticas" ||
    slug === "exoticas-riesgo-invasion-total"
  ) {
    return { tematica: "exoticas-total", subtematica: slug };
  }
  return { tematica: slug };
}

function readFromParams(params: URLSearchParams): Partial<FilterState> {
  const patch: Partial<FilterState> = {};
  const region = params.get("region");
  if (region) patch.region = region;
  // Some legacy linkers (sib-colombia ConcentricCard) emit
  // `info.slug.replace('-', '_')` which corrupts dashes to underscores
  // — only the first one. Normalize back so `peces_marinos`, etc.,
  // round-trip to the canonical dash-separated slug the API expects.
  const grupo = params.get("grupo");
  if (grupo && grupo !== "todos") patch.grupo = grupo.replace(/_/g, "-");
  const grupoTipo = params.get("grupoTipo");
  if (grupoTipo && VALID_GRUPO_TIPO.has(grupoTipo as GrupoTipo)) {
    patch.grupoTipo = grupoTipo as GrupoTipo;
  }
  // sib-colombia's ContentElement emits underscore-separated tematica
  // slugs (`amenazadas_nacional`, `exoticas_total`, `amenazadas_global`).
  // The DB and our normalizer use dashes; convert before lookup.
  const tematica = params.get("tematica");
  if (tematica && tematica !== "todas") {
    const norm = normalizeTematicaUrl(tematica.replace(/_/g, "-"));
    if (norm.tematica) patch.tematica = norm.tematica;
    if (norm.subtematica !== undefined) patch.subtematica = norm.subtematica;
    if (norm.amenazadasCategoria !== undefined) {
      patch.amenazadasCategoria = norm.amenazadasCategoria;
    }
  }
  // Explicit params override the inferred ones — applied AFTER the
  // legacy-slug expansion so the new contract supersedes the fallback.
  const subtematica = params.get("subtematica");
  if (subtematica) patch.subtematica = subtematica;
  const amen = params.get("amenazadasCategoria");
  if (amen && VALID_AMEN.has(amen as AmenazadasCategoria)) {
    patch.amenazadasCategoria = amen as AmenazadasCategoria;
  }
  const tipo = params.get("tipo");
  if (tipo && VALID_TIPO.has(tipo as Tipo)) patch.tipo = tipo as Tipo;
  const chartType = params.get("chartType");
  if (chartType && VALID_CHARTS.has(chartType as ChartType)) {
    patch.chartType = chartType as ChartType;
  }
  return patch;
}

function writeToParams(state: FilterState, params: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(params);
  const entries: [keyof FilterState, string | null][] = [
    ["region", state.region],
    ["grupo", state.grupo],
    ["grupoTipo", state.grupoTipo],
    ["tematica", state.tematica],
    ["subtematica", state.subtematica],
    ["amenazadasCategoria", state.amenazadasCategoria],
    ["tipo", state.tipo],
    ["chartType", state.chartType],
  ];
  for (const [key, val] of entries) {
    if (val === null || val === undefined || val === "") next.delete(key);
    else next.set(key, val);
  }
  // Preserve `lista_especies` param (handled separately by the species panel).
  return next;
}

/**
 * Two-way URL ↔ store sync. On mount, hydrates the store from the URL
 * (only for params actually present). On every state change, writes the
 * filter slice back to the URL with `replace: true` so forward/back still
 * work as expected.
 */
export function useExploradorUrlSync() {
  const [params, setParams] = useSearchParams();
  const hydrate = useExploradorStore((s) => s.hydrate);
  const grupo = useExploradorStore((s) => s.grupo);
  const grupoTipo = useExploradorStore((s) => s.grupoTipo);
  const hydrated = useRef(false);
  const classified = useRef(false);

  // Pre-fetch both grupo lists so the auto-classifier below has them
  // ready when the URL provides `?grupo=` without `?grupoTipo=`.
  // useQuery dedupes — these calls share the cache with the
  // GrupoPanel's own queries.
  const bio = useGrupos("biologico");
  const interes = useGrupos("interes");

  // Hydrate once on mount. Set the ref BEFORE calling `hydrate()` so
  // the store-subscribe effect below can't observe a transient
  // pre-hydrated state under React 18 concurrent rendering and push
  // defaults back to the URL.
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    const patch = readFromParams(params);
    if (Object.keys(patch).length > 0) hydrate(patch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // sib-colombia's ConcentricCard / ContentElement emit `?grupo=<slug>`
  // without an accompanying `?grupoTipo=`. Match the slug against the
  // biologico and interes catalogs and set grupoTipo so the GrupoPanel
  // shows the parent radio + child select correctly. Mirrors the R
  // explorer's grupo URL handler (exp_inputs_grupo.R:281-307).
  useEffect(() => {
    if (classified.current) return;
    if (!hydrated.current) return;
    if (!grupo || grupoTipo) return;
    if (!bio.data || !interes.data) return;
    if (bio.data.some((g) => g.slug === grupo)) {
      classified.current = true;
      hydrate({ grupoTipo: "biologico" });
    } else if (interes.data.some((g) => g.slug === grupo)) {
      classified.current = true;
      hydrate({ grupoTipo: "interes" });
    } else {
      // Unknown slug — leave as-is; the GrupoPanel will render no parent
      // checked, and downstream queries still pass the grupo through.
      classified.current = true;
    }
  }, [grupo, grupoTipo, bio.data, interes.data, hydrate]);

  // Subscribe to store changes and push to URL.
  useEffect(() => {
    const unsub = useExploradorStore.subscribe((state) => {
      if (!hydrated.current) return;
      const next = writeToParams(state as FilterState, new URLSearchParams(window.location.search));
      const cur = window.location.search.replace(/^\?/, "");
      if (next.toString() !== cur) {
        setParams(next, { replace: true });
      }
    });
    return unsub;
  }, [setParams]);
}
