import { useEffect, useState } from "react";
import { Concentric } from "./Concentric";
import { formatNumber } from "../lib/format";
import type { GeneralInfo } from "../api/types";

interface Props {
  slug: string;
  info: GeneralInfo;
}

const HIGHLIGHTED_BANNERS = ["boyaca", "narino", "santander", "tolima", "colombia"];

/**
 * Region page header with banner image, title, concentric stats circle,
 * and description. Port of HeadRegion.jsx.
 */
export function HeadRegion({ slug, info }: Props) {
  const [windowWidth, setWindowWidth] = useState(1000);

  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isMobile = windowWidth < 450;
  const bannerSlug = HIGHLIGHTED_BANNERS.includes(slug) ? slug : "regiones";
  const bannerClass = `bg-banner-${bannerSlug}`;

  const especiesEstimadas = info.especies_region_estimadas ?? 0;
  const especiesObservadas = info.especies_region_total;

  const isMunicipality = info.subtipo === "municipio";
  const showConcentric = !isMunicipality && especiesEstimadas > 0;

  return (
    <>
      <div
        className={`${bannerClass} bg-cover bg-center pt-24 lg:pt-32 pb-3.5 min-h-[550px] relative`}
      >
        {/* Dark overlay for text legibility */}
        <div className="absolute inset-0 bg-black/30 pointer-events-none" />

        <div className="w-full max-w-screen-2xl mx-auto relative">
          <div className="min-h-[180px] mt-4 flex items-center w-10/12 mx-auto">
            <h1
              className={`font-black font-inter text-white ${
                info.label.length >= 17 ? "text-5xl lg:text-[66px]" : "text-6xl lg:text-7xl"
              }`}
            >
              {info.label}
            </h1>
          </div>

          <div className="flex flex-col md:flex-row gap-y-6 w-10/12 mx-auto">
            {/* Stats column */}
            {showConcentric ? (
              <div className="md:w-1/2 relative flex items-center min-h-[200px]">
                <Concentric
                  inner={especiesObservadas}
                  outer={especiesEstimadas}
                  small={isMobile}
                />
                <div className="ml-6 text-white">
                  <p className="font-inter font-black text-lg lg:text-xl">
                    {formatNumber(especiesEstimadas)}
                  </p>
                  <p className="font-lato text-xs lg:text-sm mb-3">
                    Especies estimadas
                  </p>
                  <p className="font-inter font-black text-2xl lg:text-4xl text-yellow-green">
                    {formatNumber(especiesObservadas)}
                  </p>
                  <p className="font-lato text-xs lg:text-sm text-yellow-green">
                    Especies observadas
                  </p>
                </div>
              </div>
            ) : (
              <div className="md:w-1/2 text-yellow-green flex flex-col justify-center">
                <span className="text-3xl lg:text-5xl font-black font-inter">
                  {formatNumber(especiesObservadas)}
                </span>
                <span className="font-lato text-sm lg:text-lg">Especies observadas</span>
                {info.subtipo && (
                  <span className="font-lato text-xs text-white/80 mt-1 capitalize">
                    {info.subtipo}
                  </span>
                )}
              </div>
            )}

            {/* Description column */}
            <div className="md:w-1/2 my-auto md:border-l-2 md:border-yellow-green md:border-dotted flex items-center">
              <p className="text-white text-sm lg:text-base w-10/12 mx-auto leading-relaxed">
                {info.main_text}
              </p>
            </div>
          </div>
        </div>

        {/* Photo credit badge */}
        {info.credito_foto && (
          <div className="absolute bottom-2 right-4 bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
            <img src="/images/camera-icon.svg" alt="" className="w-3 h-3 invert" />
            {info.credito_foto}
          </div>
        )}
      </div>
    </>
  );
}
