import { useEffect } from "react";
import { useHome } from "../api/hooks";
import { Loading, ErrorBox } from "../components/layout/Loading";
import { useApp } from "../context/AppContext";
import { HeadHome } from "../components/headers/HeadHome";
import { MapComponent } from "../components/MapComponent";
import { SimpleSlider } from "../components/SimpleSlider";
import { CardDestacada } from "../components/CardDestacada";
import { InfoTooltip } from "../components/InfoTooltip";

interface Destacada {
  type: string;
  slug: string;
  label: string;
  link: string;
  especies_total: number;
  especies_estimadas: number;
  observadas: number;
}

export function Home() {
  const { data, isLoading, error, refetch } = useHome();
  const { setFooterBgColor, setBreadCrumb } = useApp();

  useEffect(() => {
    setFooterBgColor("bg-footer-green");
    setBreadCrumb([]);
  }, [setFooterBgColor, setBreadCrumb]);

  if (isLoading) return <Loading />;
  if (error) return <ErrorBox message={(error as Error).message} onRetry={() => refetch()} />;
  if (!data) return null;

  const listDataMap = data.lista_mapa as Parameters<typeof MapComponent>[0]["data"];
  const destacadas = data.destacados_regiones as Array<{
    slug_region: string;
    label_region: string;
    especies_total: number;
    especies_estimadas: number;
    observadas: number;
  }> | undefined;
  const colombia = data.colombia as
    | { especies_total: number; especies_estimadas: number; observadas: number }
    | undefined;

  if (!listDataMap || !destacadas || !colombia) {
    return (
      <ErrorBox
        message={`Home payload is missing required fields (lista_mapa=${!!listDataMap}, destacados_regiones=${!!destacadas}, colombia=${!!colombia}).`}
      />
    );
  }

  // Build cards with proper type/link based on slug
  const regionesDestacadas: Destacada[] = destacadas
    .map((region) => {
      let type = "Departamento";
      let link = `/${region.slug_region}`;
      if (region.slug_region === "reserva-forestal-la-planada") {
        type = "Reserva forestal";
        link = "/especial/reserva-forestal-la-planada";
      } else if (region.slug_region === "resguardo-indigena-pialapi-pueblo-viejo") {
        type = "Resguardo indígena";
        link = "/especial/resguardo-indigena-pialapi-pueblo-viejo";
      } else if (region.slug_region === "region-amazonia") {
        type = "Región natural";
        link = "/especial/region-amazonia";
      }
      return {
        type,
        slug: region.slug_region,
        label: region.label_region,
        link,
        especies_total: region.especies_total,
        especies_estimadas: region.especies_estimadas,
        observadas: region.observadas,
      };
    })
    .sort((a, b) => {
      // region-amazonia first, then alphabetical
      if (a.slug === "region-amazonia") return -1;
      if (b.slug === "region-amazonia") return 1;
      return a.label.localeCompare(b.label);
    });

  const totalSpecies = colombia.especies_total;

  return (
    <>
      <HeadHome totalSpecies={totalSpecies} />

      <section className="bg-white-3 pb-6 md:pb-12">
        <div className="w-10/12 flex flex-col items-center pt-10 max-w-screen-xl mx-auto">
          <div className="mx-auto space-y-4">
            <div>
              <h2 className="text-2xl lg:text-3xl text-center font-bold">
                Biodiversidad de Colombia en el mundo
              </h2>
              <div className="flex justify-center items-center">
                Colombia es el cuarto país con mayor biodiversidad del mundo
                <InfoTooltip
                  classname="ml-1"
                  label={listDataMap.ref_principal}
                  src="/images/icons/icon-information-black.svg"
                />
              </div>
            </div>
          </div>
          <MapComponent data={listDataMap} />
        </div>
        <div className="relative z-10 w-10/12 max-w-screen-xl mx-auto mt-6 flex justify-center">
          <a
            href="/colombia"
            className="flex items-center gap-x-2 max-w-[280px] px-4 py-1.5 border border-black rounded-full cursor-pointer bg-white-3"
          >
            Conocer cifras de Colombia
            <img src="/images/arrow-black.svg" className="w-3 h-4" alt="" />
          </a>
        </div>
      </section>

      <section className="bg-white-3 py-8">
        <div className="mx-auto max-w-screen-2xl">
          <div className="text-center font-inter space-y-2">
            <h2 className="font-black text-2xl">Destacados</h2>
            <span className="px-4">
              Explora la biodiversidad de los departamentos que conforman la
              región Amazonía.
            </span>
          </div>
          <div className="py-8 max-w-screen-xl mx-auto w-10/12">
            <SimpleSlider dots infinite slidestoshow={4} responsiveSlidesToShow={2}>
              {regionesDestacadas.map((item) => (
                <div key={item.slug} className="px-3">
                  <CardDestacada
                    label={item.label}
                    type={item.type}
                    link={item.link}
                    especies={item.especies_total}
                    especiesEstimadas={item.especies_estimadas}
                    observadas={item.observadas}
                  />
                </div>
              ))}
            </SimpleSlider>
          </div>
        </div>
      </section>
    </>
  );
}
