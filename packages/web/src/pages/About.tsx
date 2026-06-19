import { useEffect, useState } from "react";
import { HeadMore } from "../components/HeadMore";
import { useApp } from "../context/AppContext";

const SECTIONS: { id: string; label: string }[] = [
  { id: "acerca-de", label: "Acerca de" },
  { id: "antes-de", label: "Antes de continuar" },
  {
    id: "porque-es",
    label:
      "¿Por qué es importante conocer esta información sobre la biodiversidad de Colombia?",
  },
  {
    id: "quienes-contribuyeron",
    label: "¿Quiénes contribuyen a la construcción de esas cifras?",
  },
  { id: "como-aportar", label: "¿Cómo aportar datos?" },
  { id: "como-citar", label: "¿Cómo citar?" },
  { id: "como-navegar", label: "¿Cómo navegar?" },
];

export function About() {
  const { setFooterBgColor, setBreadCrumb } = useApp();
  const [activeId, setActiveId] = useState("acerca-de");

  useEffect(() => {
    setFooterBgColor("bg-footer-orange");
    setBreadCrumb([{ label: "Más" }, { label: "Acerca de" }]);
  }, [setFooterBgColor, setBreadCrumb]);

  // Manual scrollspy mirroring the legacy implementation.
  useEffect(() => {
    const ids = SECTIONS.map((s) => s.id);
    const onScroll = () => {
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (r.top <= 150 && r.bottom >= 150) {
          setActiveId(id);
          return;
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <HeadMore title="Acerca de" slug="acerca-de" />
      <div className="flex max-w-screen-2xl mx-auto">
        <div className="w-10/12 lg:w-9/12 mx-auto py-10 space-y-12 font-lato">
          {/* Acerca de + Antes de continuar share the first block (legacy
              had an empty h2 anchor at the top so the TOC link lands on
              "Acerca de" before the prose). */}
          <div className="space-y-2 md:w-3/4 mx-auto">
            <div className="py-1.5 w-1/2 border-t-2 border-t-flame border-dotted" />
            <h2
              id="acerca-de"
              className="text-flame font-inter text-2xl font-black"
            >
              {" "}
            </h2>

            <p className="font-lato">
              Biodiversidad en Cifras es una de las plataformas del ecosistema
              web del SiB Colombia, diseñada para presentar de manera
              sintetizada el estado del conocimiento de la biodiversidad del
              país, y su regionalización a partir de los datos e información
              disponibles a través del SiB Colombia y fuentes secundarias. Esta
              plataforma cuenta con cuatro ejes principales de síntesis: (A)
              cifras por grupos biológicos, (B) cifras por áreas geográficas,
              (C) temáticas de conservación, uso y manejo, siendo este último
              un eje transversal a los dos anteriores y (D) cifras por
              organizaciones publicadoras de datos. Adicionalmente a los cuatro
              ejes de síntesis, se presenta un paralelo con cifras estimadas
              (E) a partir de literatura.
            </p>

            <p className="font-lato">
              Biodiversidad en Cifras, además de permitir consultar el estado
              de conservación y amenaza de la biodiversidad a nivel nacional,
              representa el proceso de regionalización del SiB Colombia,
              convirtiéndose también en la ventana a la biodiversidad regional,
              con cifras más detalladas para algunas regiones, como es el caso
              para los departamentos de Santander, Boyacá, Tolima, Nariño,
              Amazonas, Caquetá, Guainía, Guaviare, Putumayo y Vaupés.
            </p>

            <p className="font-lato">
              Para la consolidación de las cifras se realizan procesos de: I.
              Consulta de datos a través del SiB Colombia, II. Validación y
              limpieza de datos, y III. Síntesis de cifras a partir de datos
              validados y cifras estimadas. A través de esta metodología se
              procesan los datos disponibles a través del SiB Colombia para
              obtener cifras que permitan realizar una adecuada gestión del
              conocimiento sobre la biodiversidad.
            </p>

            <h2
              id="antes-de"
              className="text-black-2 font-inter text-lg font-black"
            >
              Antes de continuar
            </h2>
            <p className="font-lato">
              Las cifras presentadas en esta síntesis anual son dinámicas, lo
              que quiere decir que son susceptibles de cambiar debido a la
              publicación de nuevos datos abiertos o cambios que mejoran la
              calidad y aumentan la precisión de estos, a nivel taxonómico y
              geográfico. El 100% de los datos publicados no siempre son usados
              para la síntesis de cifras, es por esto que hay cambios
              periódicos en Biodiversidad en Cifras.
            </p>

            <p className="font-lato">
              Adicionalmente, las listas de referencia taxonómicas (ACO, 2022:{" "}
              <RefLink href="https://ipt.biodiversidad.co/sib/resource?r=aco_listaavescolombia2017">
                Lista de referencia de especies de aves de Colombia
              </RefLink>
              ; ACCICTIOS, 2024:{" "}
              <RefLink href="https://ipt.biodiversidad.co/sib/resource?r=ictiofauna_colombiana_dulceacuicola">
                Lista de especies de peces de agua dulce de Colombia
              </RefLink>
              ; ACCICTIOS, 2023:{" "}
              <RefLink href="https://ipt.biodiversidad.co/sibm/resource?r=checklist_pacifico">
                Checklist of Pacific marine fishes of Colombia
              </RefLink>
              ; ACCICTIOS, 2023:{" "}
              <RefLink href="https://ipt.biodiversidad.co/sibm/resource?r=checklist_caribe">
                Checklist of Caribbean marine fishes of Colombia
              </RefLink>
              ; SCmas, 2024:{" "}
              <RefLink href="https://ipt.biodiversidad.co/sib/resource?r=mamiferos_col">
                Lista de mamíferos de Colombia
              </RefLink>
              ; UNAL, 2020:{" "}
              <RefLink href="https://ipt.biodiversidad.co/sib/resource?r=catalogo_plantas_liquenes">
                Catálogo de plantas y líquenes de Colombia
              </RefLink>
              ; ColeopCol, 2024:{" "}
              <RefLink href="https://www.gbif.org/dataset/search?publishing_org=2c39be5c-c11e-46d0-bcb4-552f2072d19f">
                Listas de especies de Coleópteros de Colombia
              </RefLink>{" "}
              y la{" "}
              <RefLink href="https://www.gbif.org/dataset/168568e7-eb5f-4ef6-8c59-f73ceaf57e91">
                lista temática de especies exóticas del país
              </RefLink>{" "}
              (Baptiste et. al, 2018), son usadas para la validación y ajuste
              de estas cifras, evitando así las sobreestimaciones.
            </p>
          </div>

          <div className="space-y-3 md:w-3/4 mx-auto">
            <div className="py-1.5 w-1/2 border-t-2 border-t-flame border-dotted" />
            <h2
              id="porque-es"
              className="text-flame font-inter text-2xl font-black"
            >
              ¿Por qué es importante conocer esta información sobre la
              biodiversidad de Colombia?
            </h2>
            <p className="font-lato">
              Conocer el número de especies registradas es el reflejo del
              proceso de consolidación del inventario sobre la biodiversidad del
              país y, al mismo tiempo, un motivo para seguir trabajando por que
              la información existente sea accesible para todos.
            </p>
            <p className="font-lato">
              El SiB Colombia facilita datos e información de la mejor forma e
              integridad posible para satisfacer las necesidades de mayor
              prioridad en procesos de investigación, educación y toma de
              decisiones. Los datos publicados a través del SiB Colombia se
              agregan a partir de muchas fuentes y por lo tanto son
              heterogéneos, variando en la idoneidad para diversos usos. El
              Equipo Coordinador ha identificado en los últimos años un uso
              claro en la síntesis de información que permita conocer el estado
              del conocimiento de la biodiversidad en el país y sus regiones, de
              modo que se facilite la toma de decisiones informadas para llenar
              los vacíos de información geográficos y taxonómicos del
              conocimiento de nuestra biodiversidad.
            </p>
          </div>

          <div className="space-y-4 md:w-3/4 mx-auto">
            <div className="py-1.5 w-1/2 border-t-2 border-t-flame border-dotted" />
            <h2
              id="quienes-contribuyeron"
              className="text-flame font-inter text-2xl font-black"
            >
              ¿Quiénes contribuyen a la construcción de esas cifras?
            </h2>
            <p className="font-lato">
              El SiB Colombia es una realidad gracias al compromiso de cada una
              de las personas y organizaciones, que renuevan constantemente su
              voto de confianza en la misión del Sistema y validan con su
              participación a través de la publicación de datos. Cada uno de
              ellos es pilar fundamental de la red para continuar consolidando
              el inventario nacional de la biodiversidad. Gracias a esta red de
              socios y a los datos compartidos es posible que el Equipo
              Coordinador del SiB Colombia logra la consolidación de información
              confiable y oportuna que apoye la toma de decisiones a nivel
              nacional e internacional.
            </p>
            <div>
              <a
                href="/mas/publicadores"
                target="_blank"
                rel="noreferrer"
                className="py-2 px-4 border border-black rounded-full font-lato"
              >
                Conocer publicadores
              </a>
            </div>
          </div>

          <div className="space-y-3 md:w-3/4 mx-auto">
            <div className="py-1.5 w-1/2 border-t-2 border-t-flame border-dotted" />
            <h2
              id="como-aportar"
              className="text-flame font-inter text-2xl font-black"
            >
              ¿Cómo aportar datos?
            </h2>
            <p className="font-lato text-lg">
              ¿Quieres publicar datos sobre biodiversidad? Esta es una
              oportunidad para aportar al conocimiento libre y que juntos
              construyamos un futuro sostenible.
            </p>
            <div className="pt-4 font-lato">
              <a
                href="https://biodiversidad.co/compartir/guia-para-publicar/"
                target="_blank"
                rel="noreferrer"
                className="py-2 px-4 border border-black rounded-full"
              >
                Entérate aquí
              </a>
            </div>
          </div>

          <div className="space-y-3 md:w-3/4 mx-auto">
            <div className="py-1.5 w-1/2 border-t-2 border-t-flame border-dotted" />
            <h2
              id="como-citar"
              className="text-flame font-inter text-2xl font-black"
            >
              ¿Cómo citar?
            </h2>
            <p className="font-lato">
              La síntesis periódica de la gestión del conocimiento desde los
              datos abiertos publicados se enriquece con otras fuentes de
              referencia nacional y se materializa en unas cifras o indicadores
              a nivel nacional y regional presentados en Biodiversidad en
              cifras. La citación de las cifras disponibles a través de este
              sitio son fundamentales para dar reconocimiento a los publicadores
              de datos y a la gestión realizada para la consolidación y
              síntesis de cifras, además de promover la transparencia en el uso
              de los datos e información.
            </p>

            <p className="font-lato">
              Aquellos usuarios que deseen citar el portal Biodiversidad en
              Cifras completo, pueden usar el siguiente ejemplo:
            </p>

            <div className="flex gap-x-4 py-2">
              <img
                className="h-full"
                src="/images/arrow-down-orange.svg"
                alt=""
              />
              <div className="flex flex-col gap-y-4 justify-between">
                <p className="font-black font-lato">
                  &quot; SiB Colombia (2022, agosto 23) Biodiversidad en
                  Cifras, Sistema de Información sobre Biodiversidad de
                  Colombia. Recuperado de: https://biodiversidad.co/cifras &quot;
                </p>
                <p className="font-lato">
                  Para una sección más precisa dentro de biodiversidad en
                  cifras usa el URL exacto que te lleva a esa sección e
                  incluyela en la parte de la cita destinada a el sitio de
                  recuperación de la información.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 md:w-3/4 mx-auto">
            <div className="py-1.5 w-1/2 border-t-2 border-t-flame border-dotted" />
            <h2
              id="como-navegar"
              className="text-flame font-inter text-2xl font-black"
            >
              ¿Cómo navegar?
            </h2>

            <p className="font-lato">
              En este sitio encontrarás diferentes formas de explorar las
              cifras sobre biodiversidad. En el menú superior puedes orientarte
              por 5 ejes principales:
            </p>

            <div className="flex flex-wrap gap-y-2 justify-between py-1.5">
              <NavTile gradient="from-lemon to-dartmouth-green">
                Colombia
              </NavTile>
              <NavTile gradient="from-lemon to-dartmouth-green">
                Regiones
              </NavTile>
              <NavTile gradient="from-science-blue to-catalina-blue">
                Grupos
              </NavTile>
              <NavTile gradient="from-dark-periwinkle to-blueberry">
                Temáticas
              </NavTile>
              <NavTile gradient="from-flame to-pastel-orange">Más</NavTile>
            </div>

            <p className="font-lato">
              En cada uno de estos ejes encontrarás un menú para que selecciones
              los perfiles sobre los cuáles deseas conocer cifras, ya sea
              Colombia, un departamento específico, un grupo biológico o una
              temática de tu interés.
            </p>
            <p className="font-lato">
              Dentro de cada perfil puedes ver diferentes franjas de
              información. Puedes conocer el detalle de las cifras dando clic
              sobre cada franja y navegar en los árboles de los grupos
              biológicos, temáticas y regiones. Estas franjas varían
              dependiendo del perfil que estes visualizando.
            </p>

            <div className="flex flex-col gap-y-3 lg:flex-row justify-between">
              <GlossaryLink search="grupos biologicos">
                Grupos biológicos
              </GlossaryLink>
              <GlossaryLink search="grupos biologicos de interes">
                Grupos de interés
              </GlossaryLink>
              <GlossaryLink search="tematicas">Temáticas</GlossaryLink>
              <GlossaryLink search="regiones">Regiones</GlossaryLink>
            </div>
          </div>
        </div>

        {/* Sidebar TOC */}
        <div className="py-10 w-3/12 mx-auto hidden md:block">
          <span className="font-black font-inter py-2">Contenidos</span>
          <ul className="space-y-2 sticky top-[5%] font-lato">
            {SECTIONS.map((s) => (
              <li
                key={s.id}
                className={`pl-4 hover:bg-[#8080801A] hover:border-l-2 hover:border-l-[#707070] ${
                  activeId === s.id ? "pl-3 border-l-2 border-flame" : ""
                }`}
              >
                <a className="p-2 block" href={`#${s.id}`}>
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}

function RefLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      target="_blank"
      rel="noreferrer"
      className="underline italic text-azure"
      href={href}
    >
      {children}
    </a>
  );
}

function NavTile({
  gradient,
  children,
}: {
  gradient: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex items-end justify-center p-1.5 text-white bg-gradient-to-b ${gradient} h-24 w-28`}
    >
      {children}
    </div>
  );
}

function GlossaryLink({
  search,
  children,
}: {
  search: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={`/mas/glosario?search=${encodeURIComponent(search)}`}
      target="_blank"
      rel="noreferrer"
      className="font-lato py-2 px-2.5 border border-black rounded-full"
    >
      {children}
    </a>
  );
}
