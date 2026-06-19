import { useState, useEffect, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import type { RegionData, TematicaSection } from "../api/types";
import { capitalize } from "../lib/format";
import { useApp } from "../context/AppContext";
import { useRegionGrupos } from "../api/hooks";
import { HeadRegion } from "./HeadRegion";
import { StickyNavbar } from "./StickyNavbar";
import { Gallery } from "./Gallery";
import { Slides } from "./Slides";
import { CardTematicas } from "./tematicas/CardTematicas";
import { ContentElement } from "./grupos/ContentElement";
import { InfoPublishers } from "./InfoPublishers";

const ChoroplethMap = lazy(() =>
  import("./maps/ChoroplethMap").then((m) => ({ default: m.ChoroplethMap }))
);

const REGIONS_WITH_MAP = new Set([
  "colombia", "amazonas", "antioquia", "arauca", "atlantico", "bogota-dc",
  "bolivar", "boyaca", "caldas", "caqueta", "casanare", "cauca", "cesar",
  "choco", "cordoba", "cundinamarca", "guainia", "guaviare", "huila",
  "la-guajira", "magdalena", "meta", "narino", "norte-santander", "putumayo",
  "quindio", "region-amazonia", "reserva-forestal-la-planada",
  "resguardo-indigena-pialapi-pueblo-viejo", "risaralda", "san-andres-providencia",
  "santander", "sucre", "tolima", "valle-del-cauca", "vaupes", "vichada",
]);

interface Props {
  data: RegionData;
  slug: string;
}

export function RegionPage({ data, slug }: Props) {
  const gi = data.general_info;
  const { setFooterBgColor, setBreadCrumb } = useApp();

  // The bundle hits /api/regions/:slug?lean=1 (banner, nav, slides,
  // map, etc.) — those render immediately. The two grupo slices are
  // ~725 KiB / ~252 KiB each, so they load via separate parallel
  // queries and fill in their sections progressively (skeleton →
  // content). Splitting them out also keeps each request's DuckDB
  // working-set small enough to stay under the Deno Deploy isolate
  // memory cap.
  const gruposBio = useRegionGrupos(slug, "biologico");
  const gruposInt = useRegionGrupos(slug, "interes");
  const gruposBioRows =
    (gruposBio.data as Record<string, unknown>[] | undefined) ?? [];
  const gruposIntRows =
    (gruposInt.data as Record<string, unknown>[] | undefined) ?? [];

  // Set footer color based on slug (matches original Next.js behavior)
  useEffect(() => {
    const isHighlighted = ["boyaca", "narino", "santander", "tolima", "colombia"].includes(slug);
    setFooterBgColor(isHighlighted ? "bg-footer-orange" : "bg-footer-green");
    setBreadCrumb([{ label: gi.label }]);
    return () => {
      setFooterBgColor("bg-footer-green");
    };
  }, [slug, gi.label, setFooterBgColor, setBreadCrumb]);

  const topLevelTematica = data.tematica.filter((s) => {
    const sl = s.slug.toLowerCase();
    return sl === "amenazadas" || sl === "cites" || sl === "endemicas" ||
      sl === "migratorias" || sl.startsWith("exoticas");
  });

  const isColombia = slug === "colombia";
  const territorioLabel = isColombia ? "Departamentos" : "Municipios";

  // Build sections list for sticky nav. Show grupos entries while
  // they're still loading (so the nav doesn't reflow when they
  // arrive); they auto-hide if the request resolves to an empty list.
  const showGruposBio = gruposBio.isLoading || gruposBioRows.length > 0;
  const showGruposInt = gruposInt.isLoading || gruposIntRows.length > 0;
  const sections = [
    topLevelTematica.length > 0 && { id: "tematicas", label: "Temáticas" },
    showGruposBio && { id: "grupos-biologicos", label: "Grupos Biológicos" },
    showGruposInt && { id: "grupos-interes", label: "Grupos de Interés" },
    REGIONS_WITH_MAP.has(slug) && { id: "territorio", label: territorioLabel },
    (data.publicadores?.publicadores_list?.length ?? 0) > 0 && { id: "publicadores", label: "Publicadores" },
  ].filter((s): s is { id: string; label: string } => !!s);

  return (
    <>
      <HeadRegion slug={slug} info={gi} />
      <StickyNavbar regionLabel={gi.label} sections={sections} />

      <div className="max-w-screen-2xl mx-auto px-6 py-12">
        {data.gallery.length > 0 && <Gallery items={data.gallery} />}
        {data.slides.length > 0 && <Slides slides={data.slides} />}

        {/* Temáticas */}
        {topLevelTematica.length > 0 && (
          <section id="tematicas" className="mb-16 scroll-mt-20">
            <SectionHeader title="Temáticas" subtitle="Explora las temáticas más relevantes" />
            <TematicaTabs sections={topLevelTematica} />
          </section>
        )}

        {/* Grupos biológicos — loaded via parallel useRegionGrupos */}
        {showGruposBio && (
          <section id="grupos-biologicos" className="mb-16 scroll-mt-20">
            <SectionHeader title="Grupos biológicos" subtitle="Distribución por grupo biológico" />
            {gruposBio.isLoading ? (
              <GruposSkeleton />
            ) : gruposBioRows.length > 0 ? (
              <GruposTabs grupos={gruposBioRows} region={gi.label} />
            ) : null}
          </section>
        )}

        {/* Grupos de interés — loaded via parallel useRegionGrupos */}
        {showGruposInt && (
          <section id="grupos-interes" className="mb-16 scroll-mt-20">
            <SectionHeader title="Grupos de interés" subtitle="Grupos con interés especial de conservación" />
            {gruposInt.isLoading ? (
              <GruposSkeleton />
            ) : gruposIntRows.length > 0 ? (
              <GruposTabs grupos={gruposIntRows} />
            ) : null}
          </section>
        )}

        {/* Mapa de territorio */}
        {REGIONS_WITH_MAP.has(slug) && (
          <section id="territorio" className="mb-16 scroll-mt-20">
            <SectionHeader
              title={isColombia ? "Departamentos" : "Municipios"}
              subtitle="Distribución geográfica"
            />
            <Suspense
              fallback={
                <div className="bg-gray-50 rounded h-[500px] flex items-center justify-center text-gray-500">
                  Cargando mapa...
                </div>
              }
            >
              <ChoroplethMap
                geojsonUrl={`/static/geo/${slug}.geojson`}
                metric="especies"
                linkPrefix={isColombia ? "/" : `/${slug}/`}
                height={500}
              />
            </Suspense>
          </section>
        )}

        {/* Subregions list */}
        {((isColombia && data.departamentos_lista.length > 0) ||
          data.municipios_lista.length > 0) && (
          <section className="mb-16">
            <h3 className="font-barlow-condensed text-2xl text-dartmouth-green mb-4">
              {isColombia ? "Todos los departamentos" : "Todos los municipios"}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-2 text-sm">
              {(isColombia ? data.departamentos_lista : data.municipios_lista).map((r) => (
                <Link
                  key={r.slug}
                  to={isColombia ? `/${r.slug}` : `/${slug}/${r.slug}`}
                  className="text-dartmouth-green hover:text-flame hover:underline"
                >
                  {r.label}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Publicadores */}
        {data.publicadores?.publicadores_list?.length > 0 && (
          <section id="publicadores" className="mb-16 scroll-mt-20">
            <SectionHeader
              title={`Publicadores en ${gi.label}`}
              subtitle="Organizaciones que comparten datos"
            />
            <InfoPublishers
              publicadoresList={data.publicadores.publicadores_list as Parameters<typeof InfoPublishers>[0]["publicadoresList"]}
              publicadoresTipo={data.publicadores.publicadores_tipo as Parameters<typeof InfoPublishers>[0]["publicadoresTipo"]}
            />

            {/* Logos grid */}
            <PublishersLogosGrid publicadores={data.publicadores} />
          </section>
        )}
      </div>
    </>
  );
}

function GruposSkeleton() {
  return (
    <div role="status" aria-label="Cargando grupos">
      <div className="flex flex-wrap justify-center gap-2 mb-8 max-h-32 overflow-y-auto animate-pulse">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-7 w-24 bg-gray-200 rounded-full" />
        ))}
      </div>
      <div className="bg-gray-50 rounded h-[480px] flex items-center justify-center">
        <div className="animate-pulse w-2/3 h-full p-8 flex flex-col gap-4">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="h-40 bg-gray-200 rounded mt-auto" />
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="mb-8 text-center">
      <h2 className="font-barlow-condensed text-4xl md:text-5xl text-dartmouth-green font-bold">
        {title}
      </h2>
      {subtitle && (
        <p className="text-gray-600 mt-2 max-w-2xl mx-auto">{subtitle}</p>
      )}
      <div className="w-16 h-1 bg-flame mx-auto mt-4" />
    </header>
  );
}

function TematicaTabs({ sections }: { sections: TematicaSection[] }) {
  const [selected, setSelected] = useState(sections[0]?.slug ?? "");
  const active = sections.find((s) => s.slug === selected) ?? sections[0];

  return (
    <div>
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {sections.map((s) => {
          const isActive = s.slug === selected;
          return (
            <button
              key={s.slug}
              type="button"
              onClick={() => setSelected(s.slug)}
              className={`px-5 py-2 text-sm font-semibold rounded-full transition border-2 cursor-pointer ${
                isActive
                  ? "bg-dartmouth-green text-white border-dartmouth-green"
                  : "bg-white text-gray-700 border-gray-200 hover:border-dartmouth-green"
              }`}
            >
              {capitalize(s.slug.replace("-total", ""))}
            </button>
          );
        })}
      </div>
      {active && <CardTematicas section={active} />}
    </div>
  );
}

function GruposTabs({ grupos, region }: { grupos: Record<string, unknown>[]; region: string }) {
  const [selected, setSelected] = useState((grupos[0] as { slug: string })?.slug ?? "");
  const active = grupos.find((g) => (g as { slug: string }).slug === selected) ?? grupos[0];

  return (
    <div>
      <div className="flex flex-wrap justify-center gap-2 mb-8 max-h-32 overflow-y-auto">
        {grupos.map((g) => {
          const grupo = g as { slug: string };
          const isActive = grupo.slug === selected;
          return (
            <button
              key={grupo.slug}
              type="button"
              onClick={() => setSelected(grupo.slug)}
              className={`px-4 py-2 text-xs font-semibold rounded-full transition capitalize cursor-pointer ${
                isActive
                  ? "bg-lemon text-white"
                  : "bg-white text-gray-700 border border-gray-200 hover:border-lemon"
              }`}
            >
              {grupo.slug.replace(/-/g, " ")}
            </button>
          );
        })}
      </div>
      {active && (
        <ContentElement
          grupo={active as Parameters<typeof ContentElement>[0]["grupo"]}
          region={region}
        />
      )}
    </div>
  );
}

function PublishersLogosGrid({
  publicadores,
}: {
  publicadores: RegionData["publicadores"];
}) {
  const list = publicadores.publicadores_list as Array<{
    slug_publicador: string;
    label: string;
    registros: number;
    especies: number;
    url_logo: string | null;
    url_socio: string | null;
  }>;
  return (
    <div className="mt-6 grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-3">
      {list.slice(0, 24).map((p, i) => (
        <a
          key={`${p.slug_publicador}-${i}`}
          href={p.url_socio ?? "#"}
          target="_blank"
          rel="noreferrer"
          className="bg-white shadow-default p-2 text-center hover:shadow-select transition aspect-square flex items-center justify-center"
          title={p.label}
        >
          {p.url_logo
            ? (
              <img
                src={p.url_logo}
                alt={p.label}
                className="max-h-full max-w-full object-contain"
                loading="lazy"
              />
            )
            : (
              <p className="text-[10px] text-dartmouth-green">{p.label}</p>
            )}
        </a>
      ))}
    </div>
  );
}
