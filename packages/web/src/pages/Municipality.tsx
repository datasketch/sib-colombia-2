import { useCallback, useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { Loading, ErrorBox } from "../components/layout/Loading";

// @ts-expect-error legacy JSX
import HeadRegion from "../components-legacy/headers/HeadRegion.jsx";
// @ts-expect-error legacy JSX
import PageComponent from "../components-legacy/PageComponent.jsx";

// @ts-expect-error legacy JSON
import dataMapColombia from "../data/colombia-world-map.json";

interface MuniData {
  // deno-lint-ignore no-explicit-any
  general_info: any;
  // deno-lint-ignore no-explicit-any
  [k: string]: any;
}

export function Municipality() {
  const { slug = "", municipio = "" } = useParams();
  const ctx = useContext(AppContext);
  const [data, setData] = useState<MuniData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(() => {
    setData(null);
    setError(null);
    fetch(`/api/regions/${municipio}`)
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(String(e)));
  }, [municipio]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (!data) return;
    ctx?.setFooterBgColor("bg-footer-green");
    ctx?.setBreadCrumb([
      { label: slug },
      { label: data.general_info?.label ?? municipio },
    ]);
    // `ctx` is intentionally NOT a dependency. Its setters are stable, but
    // AppProvider rebuilds its context *value* object every render, so the
    // setBreadCrumb call here would change `ctx`'s identity, re-trigger this
    // effect, and spin into "Maximum update depth exceeded". Re-run only when
    // the municipality payload changes.
  }, [data, slug, municipio]);

  if (error) return <ErrorBox message={error} onRetry={loadData} />;
  if (!data) return <Loading label={`Cargando ${municipio}...`} />;

  const generalInfo = data.general_info;

  return (
    <div>
      <HeadRegion
        slug={municipio}
        title={generalInfo.label}
        description={generalInfo.main_text}
        especiesEstimadas={generalInfo.especies_region_estimadas}
        especiesObservadas={generalInfo.especies_region_total}
        marine={generalInfo.marino}
        imageMap={`data/${slug}/${slug}.svg`}
        imageSmallDpto={`images/mapas-svg-dep/mapa-${slug}.svg`}
        referencia={generalInfo.referencia}
        photoLabel={generalInfo.credito_foto}
        municipality
      />
      <PageComponent
        data={data}
        slug={municipio}
        municipality={municipio}
        municipalityflag
        map={dataMapColombia}
      />
    </div>
  );
}
