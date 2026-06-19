import { useEffect } from "react";
import { HeadMore } from "../components/HeadMore";
import { useApp } from "../context/AppContext";

interface PressItem {
  date: string;
  title: string;
  description: string;
  link: string;
}

const PRESS_ITEMS: PressItem[] = [
  {
    date: "2024",
    title: "Lista de especies amenazadas de Colombia",
    description:
      "Actualización de la lista de especies amenazadas de Colombia, un insumo fundamental para la conservación.",
    link:
      "https://biodiversidad.co/post/2024/lista-especies-amenazadas-colombia/",
  },
  {
    date: "2024",
    title: "CESP National Portals",
    description:
      "Colombia participa en el proyecto CESP National Portals para fortalecer los portales nacionales de biodiversidad.",
    link: "https://biodiversidad.co/post/2024/cesp-national-portals/",
  },
  {
    date: "2024",
    title: "COP16: SiB Colombia, datos vivos para la biodiversidad",
    description:
      "El Sistema de Información sobre Biodiversidad de Colombia presente en la COP16 con datos vivos para la conservación.",
    link: "https://biodiversidad.co/post/2024/cop16-sib-datos-vivos/",
  },
  {
    date: "2024",
    title: "Actualización de Biodiversidad en Cifras",
    description:
      "Nueva versión de Biodiversidad en Cifras con datos actualizados sobre la biodiversidad de Colombia.",
    link:
      "https://biodiversidad.co/post/2024/actualizacion-biodiversidad-en-cifras/",
  },
  {
    date: "23 de mayo de 2022",
    title: "Cómo cuidar la biodiversidad de Colombia",
    description:
      "La diversidad biológica es de gran importancia para las generaciones presentes y futuras, desde el SiB Colombia queremos compartir algunas acciones para cuidarla.",
    link:
      "https://biodiversidad.co/post/2022/como-cuidar-biodiversidad-colombia/",
  },
  {
    date: "22 de mayo de 2022",
    title: "Biodiversidad de Colombia en cifras 2022",
    description:
      "Biodiversidad en cifras es el consolidado anual de las especies registradas en el país, elaborado a partir de los datos abiertos compartidos a través del SiB Colombia.",
    link:
      "https://biodiversidad.co/post/2022/biodiversidad-colombia-cifras-2022/",
  },
];

const KIT_PDF =
  "/files/Kit_prensa-Cifras_Sobre_Biodiversidad_de_Colombia.pdf";

export function Press() {
  const { setFooterBgColor, setBreadCrumb } = useApp();
  useEffect(() => {
    setFooterBgColor("bg-footer-orange");
    setBreadCrumb([{ label: "Más" }, { label: "Prensa" }]);
  }, [setFooterBgColor, setBreadCrumb]);

  return (
    <>
      <HeadMore title="Prensa" slug="prensa" />

      {/* Kit de prensa + Contacto pill — same layout as the legacy
          .bg-prensa rounded card. */}
      <div className="w-11/12 lg:w-8/12 mx-auto max-w-screen-2xl py-12">
        <div className="bg-prensa pt-2 w-full h-[26rem] rounded-[2.37rem] flex justify-center items-center">
          <div className="flex flex-col gap-x-10 mx-auto justify-center items-center md:flex-row md:w-4/5 lg:w-full">
            <div className="flex flex-col items-center pt-3.5 md:pt-0 text-center gap-y-3 lg:justify-evenly mx-auto w-10/12 lg:w-5/12">
              <h2 className="text-4xl lg:text-6xl text-science-blue font-inter font-black">
                Kit de prensa
              </h2>
              <span>
                Descarga las cifras destacadas sobre la biodiversidad de
                Colombia para el 2025.
              </span>
              <a
                className="flex bg-white-2 justify-center items-center gap-2 py-1.5 w-5/6 px-2 border border-black rounded-full"
                href={KIT_PDF}
                rel="noopener noreferrer"
                target="_blank"
                download
              >
                <span className="text-base font-lato">
                  Descargar kit de prensa
                </span>
                <img className="w-3 h-4" src="/images/icon-download.svg" alt="" />
              </a>
            </div>
            <div className="mt-4 mx-auto text-center md:text-left lg:space-y-6 lg:pl-9 md:border-l-2 md:pl-10 border-pastel-periwinkle border-dotted w-10/12 lg:w-5/12">
              <span className="font-inter font-black text-xl md:text-2xl lg:text-4xl">
                Contacto
              </span>
              <div className="flex flex-col w-2/3 mx-auto md:w-full">
                <span className="font-lato">
                  Sistema de Información sobre Biodiversidad de Colombia
                </span>
                <a
                  href="mailto:sib@humboldt.org.co"
                  className="font-lato hover:text-flame"
                >
                  sib@humboldt.org.co
                </a>
                <span className="font-lato">Colombia</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenidos relevantes */}
      <div className="max-w-screen-2xl mx-auto w-11/12 lg:w-9/12 pb-12">
        <span className="text-flame font-black font-inter text-xl md:text-2xl">
          Contenidos relevantes
        </span>
        <div className="py-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {PRESS_ITEMS.map((item, i) => (
            <div key={i} className="mx-auto lg:mx-0 h-full">
              <ContentCard
                date={item.date}
                title={item.title}
                description={item.description}
                href={item.link}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function ContentCard({
  date,
  title,
  description,
  href,
}: {
  date: string;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <div className="shadow-default space-y-3 max-w-sm p-5 h-full flex flex-col justify-between">
      <div>
        <div className="font-lato italic text-sm">{date}</div>
        <div className="font-lato font-bold">{title}</div>
      </div>
      <div className="font-lato flex-1">{description}</div>
      <div className="mt-4">
        <a
          target="_blank"
          rel="noreferrer"
          href={href}
          className="flex items-center py-2 justify-center gap-2 border border-black rounded-full w-full min-w-[160px]"
        >
          <span className="text-sm">Conocer más</span>
          <img src="/images/arrow-black.svg" alt="" />
        </a>
      </div>
    </div>
  );
}
