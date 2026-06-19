import { Map } from "./Map";
import { CardRank } from "./CardRank";

interface ListMapData {
  country_ranking: Array<{
    puesto: number;
    pais: string;
    "..gt_id": string;
    "..gt_name": string;
    "..gt_map_name": string;
    lat?: number;
    lon?: number;
  }>;
  positions?: Array<{ position: number; suffix: string; position_text: string }>;
  position_refs?: Array<{ ref_id: number; label: string; zotero?: string }>;
  ref_principal: string;
}

interface Props {
  data: ListMapData;
}

/**
 * Home page world map + ranking cards section.
 * Port of MapComponent.jsx.
 */
export function MapComponent({ data }: Props) {
  return (
    <div className="flex flex-col gap-4 md:gap-10 h-full w-full mt-6 -mb-6 md:-mb-16">
      <section className="flex flex-col lg:flex-row">
        <div className="lg:w-1/3 mt-10 flex flex-col gap-3">
          {data?.positions?.map((pos) => (
            <CardRank
              key={`cr${pos.position}`}
              info={pos}
              refs={data.position_refs ?? []}
            />
          ))}
        </div>
        <div className="w-full lg:w-2/3 mt-10 lg:mt-16">
          <Map details={data.country_ranking} />
        </div>
      </section>
    </div>
  );
}
