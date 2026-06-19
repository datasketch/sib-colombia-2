import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { InfoTooltip } from "../InfoTooltip";

interface Props {
  /** Total species observed in Colombia (from /api/regions/colombia or home.json) */
  totalSpecies: number;
}

/**
 * Home page banner header. Port of HeadHome.jsx.
 */
export function HeadHome({ totalSpecies }: Props) {
  const totalSpeciesFormatted = totalSpecies.toLocaleString().replace(/,/g, ".");

  const textHome =
    'Colombia es uno de los pocos países megadiversos del mundo, una de cada diez especies conocidas habita nuestro territorio. \n\n Este sitio es una aproximación al conocimiento de la extensa riqueza biológica del país, ofrece una síntesis de cifras —constantemente actualizada— sobre las especies con al menos una observación publicada a través del <a href="https://biodiversidad.co/" target="_blank"><u>Sistema de Información sobre Biodiversidad de Colombia</u></a>.';

  return (
    <>
      <div className="bg-banner-home bg-center bg-cover h-screen-75">
        <div className="max-w-screen-xl mx-auto h-full relative w-10/12 flex items-center">
          <div className="bg-black-2 bg-opacity-75 text-white flex flex-col items-center w-4/5 mx-auto md:w-2/3 justify-center px-6 py-3.5 lg:py-3 lg:absolute lg:top-1/4 lg:w-5/12">
            <div className="flex flex-col w-full text-left p-2">
              <span className="font-inter font-black text-4xl md:text-7xl">
                {totalSpeciesFormatted}
              </span>
              <span className="font-inter font-black pb-2 pt-2 text-sm md:text-base">
                Especies observadas en Colombia
              </span>
              <div className="w-1/3 border-t-2 border-dotted border-t-light-peagreen" />
            </div>
            <ReactMarkdown
              rehypePlugins={[rehypeRaw]}
              className="space-y-2 font-lato text-xs md:text-base pt-2 break-words"
              components={{
                p: ({ children }) => <p>{children}</p>,
                a: ({ href, children }) => (
                  <a href={href} target="_blank" rel="noreferrer">
                    <u>{children}</u>
                  </a>
                ),
              }}
            >
              {textHome}
            </ReactMarkdown>
          </div>
        </div>
      </div>
      <div className="relative max-w-screen-xl w-9/12 mx-auto flex justify-end">
        <div className="absolute -top-12">
          <InfoTooltip
            src="/images/camera-icon.svg"
            label="Autor: Felipe Villegas-Vélez<br>Publicada el Miércoles 6 Noviembre 2024"
          />
        </div>
      </div>
    </>
  );
}
