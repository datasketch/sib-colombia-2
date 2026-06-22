import { useCallback, useEffect, useMemo, useState, useContext } from "react";
import { useParams, useLocation } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { ErrorBox } from "../components/layout/Loading";
import { NotFound } from "./NotFound";
import { capitalize } from "../lib/format";

// @ts-expect-error legacy JSX
import HeadRegion from "../components-legacy/headers/HeadRegion.jsx";
// @ts-expect-error legacy JSX
import PageComponent from "../components-legacy/PageComponent.jsx";

interface RegionData {
  // deno-lint-ignore no-explicit-any
  general_info: any;
  // deno-lint-ignore no-explicit-any
  [k: string]: any;
}

/**
 * Generic region page — renders any region (department, special, etc.)
 * using the legacy sib-colombia React components. Data fetched from
 * /api/regions/:slug which serves either:
 *  - the static {slug}.json from packages/api/static/ (canonical visual contract)
 *  - or the DuckDB-computed shape (fallback)
 */
export function Region() {
  const { slug } = useParams();
  const location = useLocation();
  // /colombia route has no :slug param — derive from pathname
  const regionSlug = slug ?? location.pathname.replace(/^\//, "");
  const ctx = useContext(AppContext);

  const [data, setData] = useState<RegionData | null>(null);
  // deno-lint-ignore no-explicit-any
  const [gruposBio, setGruposBio] = useState<any[] | null>(null);
  // deno-lint-ignore no-explicit-any
  const [gruposInt, setGruposInt] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const loadData = useCallback((signal?: AbortSignal) => {
    setData(null);
    setGruposBio(null);
    setGruposInt(null);
    setError(null);
    setNotFound(false);

    // Swallow AbortError silently — happens on every navigation and
    // every StrictMode dev-mode double-mount. Real errors still
    // bubble to setError.
    const isAbort = (e: unknown) =>
      e instanceof DOMException && e.name === "AbortError";

    // Banner-fast path: ?lean=1 omits the heavy grupos arrays so the
    // page can render hero + nav + slides + map the moment this
    // resolves (~2-3s cold instead of 4-13s for the bundled response).
    fetch(`/api/regions/${regionSlug}?lean=1`, { signal })
      .then((r) => {
        if (r.status === 404) {
          setNotFound(true);
          return null;
        }
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
        return r.json();
      })
      .then((d) => {
        if (d) setData(d);
      })
      .catch((e) => { if (!isAbort(e)) setError(String(e)); });

    // Heavy slices fire in parallel — the page renders skeletons in
    // those sections until the data arrives, so the banner doesn't
    // wait for ~1 MiB of grupo data to finish.
    fetch(`/api/regions/${regionSlug}/grupos?tipo=biologico`, { signal })
      .then((r) => (r.ok ? r.json() : []))
      .then((g) => setGruposBio(Array.isArray(g) ? g : []))
      .catch((e) => { if (!isAbort(e)) setGruposBio([]); });

    fetch(`/api/regions/${regionSlug}/grupos?tipo=interes`, { signal })
      .then((r) => (r.ok ? r.json() : []))
      .then((g) => setGruposInt(Array.isArray(g) ? g : []))
      .catch((e) => { if (!isAbort(e)) setGruposInt([]); });
  }, [regionSlug]);

  useEffect(() => {
    // Wire an AbortController so React's cleanup cancels in-flight
    // fetches when the component unmounts (or StrictMode double-mounts
    // in dev). Without this, every nav triggers a wave of "AbortError:
    // The request has been cancelled" lines in the Vite proxy log.
    const ctrl = new AbortController();
    loadData(ctrl.signal);
    return () => ctrl.abort();
  }, [loadData]);

  useEffect(() => {
    if (!data) return;
    const slug = regionSlug;
    const isHighlighted = ["boyaca", "narino", "santander", "tolima", "colombia"].includes(slug);
    ctx?.setFooterBgColor(isHighlighted ? "bg-footer-orange" : "bg-footer-green");
    ctx?.setBreadCrumb([{ label: data.general_info?.label ?? slug }]);
    // `ctx` is intentionally NOT a dependency. Its setters are stable, but
    // AppProvider rebuilds its context *value* object every render, so the
    // setBreadCrumb call here would change `ctx`'s identity, re-trigger this
    // effect, and spin into "Maximum update depth exceeded". Re-run only when
    // the region payload changes.
  }, [data, regionSlug]);

  if (notFound) return <NotFound />;
  if (error) return <ErrorBox message={error} onRetry={loadData} />;

  const generalInfo = data?.general_info ?? null;
  // Show the green hero strip + region title from the moment the
  // page mounts — title is derived from the slug so we don't have
  // to wait for /api/regions/:slug?lean=1 to start drawing the
  // banner. Numbers/description fade in once data lands. Image
  // paths are slug-derived already so the SVG outline can render
  // immediately.
  const fallbackTitle = capitalize(regionSlug.replace(/-/g, " "));

  // Merge the lean bundle with the parallel grupo slices as they
  // arrive. Each setGruposBio/setGruposInt above triggers a
  // re-render here; PageComponent re-mounts the grupos sections
  // when these go from `[]` (skeleton) to populated.
  const mergedData: RegionData | null = data
    ? {
        ...data,
        grupos_biologicos: gruposBio ?? [],
        grupos_interes: gruposInt ?? [],
      }
    : null;
  const gruposBioLoading = gruposBio === null;
  const gruposIntLoading = gruposInt === null;

  // The legacy map components colour features by feature.properties
  // counts. Geometry + LIVE counts both come from the server's
  // territorio[0].map_data (getMapData joins region_tematica by slug at
  // request time), so reshape those items into a FeatureCollection. No
  // static-geojson fallback: if there's no map_data there's no map.
  // Memoize so the FeatureCollection keeps a stable identity across the
  // re-renders triggered by the parallel grupo fetches. MapMunicipios has a
  // `useEffect(..., [data])` that seeds the default selection; rebuilding this
  // object every render would change that dependency each time and spin into
  // "Maximum update depth exceeded". Only recompute when the payload changes.
  const mapFc = useMemo(() => {
    // deno-lint-ignore no-explicit-any
    const mapItems: any[] = data?.territorio?.[0]?.map_data ?? [];
    if (!mapItems.length) return null;
    return {
      type: "FeatureCollection",
      features: mapItems.map((it) => ({
        type: "Feature",
        properties: {
          id: it.id,
          label: it.label,
          n_especies: it.n_especies,
          n_registros: it.n_registros,
        },
        geometry: it.geom,
      })),
    };
  }, [data]);

  return (
    <div>
      <HeadRegion
        slug={regionSlug}
        title={generalInfo?.label ?? fallbackTitle}
        description={generalInfo?.main_text}
        especiesEstimadas={generalInfo?.especies_region_estimadas}
        especiesObservadas={generalInfo?.especies_region_total}
        marine={generalInfo?.marino}
        imageMap={
          regionSlug === "colombia"
            ? "images/colombia.svg"
            : `api/locator/${regionSlug}/silhouette.svg`
        }
        referencia={generalInfo?.referencia}
        photoLabel={generalInfo?.credito_foto}
      />
      {mergedData ? (
        <PageComponent
          data={mergedData}
          slug={regionSlug}
          map={mapFc}
          gruposBioLoading={gruposBioLoading}
          gruposIntLoading={gruposIntLoading}
        />
      ) : (
        <BodySkeleton />
      )}
    </div>
  );
}

/**
 * Pulse-block shell shown below the banner while /api/regions/:slug?lean=1
 * is in flight. Visually mimics the section rhythm of PageComponent so
 * the page doesn't reflow much when real content arrives.
 */
function BodySkeleton() {
  return (
    <div className="space-y-4 mt-3" role="status" aria-label="Cargando contenido">
      {[0, 1, 2].map((i) => (
        <div key={i} className="py-10 bg-white-2">
          <div className="mx-auto w-10/12 max-w-screen-2xl animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-8" />
            <div className="flex flex-wrap gap-2 mb-6">
              {Array.from({ length: 6 }).map((_, j) => (
                <div key={j} className="h-8 w-28 bg-gray-200 rounded-full" />
              ))}
            </div>
            <div className="h-[320px] bg-gray-100 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
