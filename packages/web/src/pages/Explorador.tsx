import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { Explorer } from "../features/explorador";

const HERO_DESCRIPTION =
  "Realiza múltiples cruces de información y genera gráficos para visualizar y analizar el comportamiento de los datos sobre biodiversidad según tu interés";

const HOW_IT_WORKS =
  "En la barra de la izquierda puedes seleccionar diferentes valores para los datos, si los quieres ver por registros o especies o filtrarlos para cada una de las temáticas de especies amenazadas, objeto de comercio, etc. En el panel de la derecha puedes ver los resultados como tablas o gráficos dependiendo de las opciones que selecciones.";

const FEEDBACK_FORM_URL = "https://forms.gle/Wb45MnSCgN6YVsdc6";

export function Explorador() {
  const { setFooterBgColor, setBreadCrumb } = useApp();
  const [howOpen, setHowOpen] = useState(true);

  useEffect(() => {
    // Orange theme matches the legacy /explorador in
    // sib-colombia/pages/explorador.jsx:20 (bg-footer-orange) — paired
    // with the bg-banner-mas asset that HeadMore.jsx falls back to when
    // the page passes no `slug`.
    setFooterBgColor("bg-footer-orange");
    setBreadCrumb([{ label: "Explorador" }]);
  }, [setFooterBgColor, setBreadCrumb]);

  return (
    <div className="w-full">
      {/* Centered banner. Background uses the green "regiones" photo
          (banner-principales/regiones.jpg) per request — only the banner
          background; footer theming stays orange. */}
      <div className="bg-banner-regiones bg-cover bg-center h-80 pt-20 lg:pt-20 flex items-center text-white">
        <div className="w-4/5 lg:w-2/5 mx-auto text-center space-y-2">
          <span className="text-4xl lg:text-5xl font-black font-inter">Explorador</span>
          <div className="border-b-[1px] border-b-white w-4/5 lg:w-2/3 mx-auto" />
          <p className="font-lato text-sm">{HERO_DESCRIPTION}</p>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-6 pt-8">
        <p className="flex items-center justify-end gap-x-4 text-sm">
          <span className="bg-blueberry text-white px-3 py-2 rounded-full text-xs font-bold tracking-wider uppercase">
            Versión 1.0
          </span>
          <a
            href={FEEDBACK_FORM_URL}
            target="_blank"
            rel="noreferrer"
            className="underline cursor-pointer"
          >
            Ayúdanos a mejorar la aplicación
          </a>
        </p>

        <div className="pt-8 mx-auto">
          <button
            type="button"
            onClick={() => setHowOpen((o) => !o)}
            aria-expanded={howOpen}
            className="flex items-center justify-center mx-auto gap-x-4 border border-black px-3 py-2 rounded-full cursor-pointer w-2/3 md:w-2/5 lg:w-1/4 bg-white"
          >
            <span>Cómo funciona esta herramienta</span>
            <span
              aria-hidden
              className={`text-xl font-bold leading-none ${howOpen ? "rotate-90" : "-rotate-90"}`}
            >
              ›
            </span>
          </button>
          {howOpen && (
            <div className="mt-4 mx-auto max-w-5xl">
              <p className="text-left">{HOW_IT_WORKS}</p>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-6 py-6">
        <Explorer />
      </div>
    </div>
  );
}
