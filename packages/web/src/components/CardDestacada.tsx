import { formatNumber } from "../lib/format";

interface Props {
  type: string;
  label: string;
  link: string;
  especies: number;
  especiesEstimadas?: number;
  observadas: number;
}

/**
 * Featured region card with destacada background.
 * Port of CardDestacada.jsx.
 */
export function CardDestacada({
  type, label, link, especies, especiesEstimadas = 0, observadas,
}: Props) {
  return (
    <div
      className="h-80 w-full max-w-[208px] py-3 px-2.5 flex flex-col justify-between"
      style={{
        backgroundImage: "url('/images/bg-destacada.png')",
        backgroundSize: "cover",
      }}
    >
      <div className="text-white flex flex-col gap-y-0.5">
        <span className="font-inter font-normal text-sm">{type}</span>
        <span className="font-black font-inter text-3xl">{label}</span>
      </div>
      <div>
        <div className="w-1/3 border-t-2 border-dotted border-t-light-peagreen pb-1.5" />
        <div className="flex flex-col gap-y-3">
          <div className="space-y-0.5">
            <div className="flex gap-x-1 font-black text-light-peagreen">
              <span className="font-inter">{formatNumber(especies)}</span>
              <span className="font-lato">Especies</span>
            </div>
            <div
              className="flex gap-x-1 text-light-peagreen text-xs flex-wrap"
              style={{ minHeight: "1rem" }}
            >
              <span className="font-inter">
                {especiesEstimadas > 0 ? formatNumber(especiesEstimadas) : "\u00A0"}
              </span>
              <span className="font-lato">
                {especiesEstimadas > 0 ? "Estimadas" : "\u00A0"}
              </span>
            </div>
            <div className="flex gap-x-1 text-white text-xs flex-wrap">
              <span className="font-inter">{formatNumber(observadas)}</span>
              <span className="font-lato">Observaciones</span>
            </div>
          </div>
          <a
            href={link}
            className="flex justify-evenly px-3 py-1 w-9/12 font-lato text-sm self-end text-white border border-white rounded-full"
          >
            <span>Ver más</span>
            <img src="/images/arrow-white-right.svg" alt="" />
          </a>
        </div>
      </div>
    </div>
  );
}
