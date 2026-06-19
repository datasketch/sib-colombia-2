import { formatNumber, validateDifNa, calculateWidth, capitalize } from "../../lib/format";
import { SpeciesTable } from "../common/SpeciesTable";
import { Treemap } from "../charts/Treemap";
import { Concentric } from "../Concentric";
import type { SpeciesListItem } from "../../api/types";

interface GrupoData {
  slug: string;
  label?: string;
  especies_region_total?: number | null;
  registros_region_total?: number | null;
  especies_amenazadas_nacional_total?: number | null;
  especies_amenazadas_nacional_cr?: number | null;
  especies_amenazadas_nacional_en?: number | null;
  especies_amenazadas_nacional_vu?: number | null;
  registros_amenazadas_nacional_total?: number | null;
  especies_amenazadas_global_total?: number | null;
  especies_amenazadas_global_cr?: number | null;
  especies_amenazadas_global_en?: number | null;
  especies_amenazadas_global_vu?: number | null;
  registros_amenazadas_global_total?: number | null;
  especies_cites_total?: number | null;
  especies_cites_i?: number | null;
  especies_cites_i_ii?: number | null;
  especies_cites_ii?: number | null;
  especies_cites_iii?: number | null;
  registros_cites_total?: number | null;
  parent?: {
    slug: string;
    label: string;
    especies_region_total: number;
    registros_region_total: number;
  } | null;
  estimadas?: Record<string, number | null>;
  subgrupo_especies?: { slug_grupo: string; label_grupo: string; especies_region_total: number }[];
  species_list_top?: SpeciesListItem[];
  species_list_tematica?: Record<string, SpeciesListItem[]>;
  [key: string]: unknown;
}

interface Props {
  grupo: GrupoData;
  region: string;
}

/**
 * Biological / interest group card.
 * Layout: concentric stat circle on left, treemap + 3 thematic cards on right.
 * Port of ContentElement.jsx.
 */
export function ContentElement({ grupo, region }: Props) {
  const especies = grupo.especies_region_total ?? 0;
  const registros = grupo.registros_region_total ?? 0;
  const parentEspecies = grupo.parent?.especies_region_total ?? especies;
  const groupName = (grupo.label ?? grupo.slug).toLowerCase();

  const subgrupoData =
    grupo.subgrupo_especies?.map((sg) => ({
      name: sg.label_grupo,
      size: sg.especies_region_total,
    })) ?? [];

  return (
    <div className="bg-white py-10 min-h-[500px]">
      <div className="w-11/12 mx-auto flex flex-col lg:flex-row gap-10 justify-between">
        {/* Concentric stat card (left) */}
        <div className="lg:w-4/12 px-3 py-4">
          <div className="font-black text-6xl font-inter">
            {formatNumber(especies)}
            <div className="border-b-2 border-dartmouth-green w-2/3" />
          </div>
          <p className="font-inter font-black text-lg mt-2">
            Especies de {groupName}
          </p>

          <p className="text-sm font-inter text-blue-green mt-3">
            <strong>{formatNumber(registros)}</strong> Observaciones
          </p>

          {/* Concentric circles */}
          <div className="relative mt-8 ml-4">
            <ConcentricCardStyle2
              outer={parentEspecies}
              inner={especies}
            />
            <div className="mt-4 space-y-3">
              <div>
                <span className="font-black text-base">{formatNumber(especies)}</span>
                <p className="text-xs">
                  Especies de {groupName} en {region}
                </p>
              </div>
              <div>
                <span className="font-black text-base">{formatNumber(parentEspecies)}</span>
                <p className="text-xs">
                  Especies de {groupName} en{" "}
                  {grupo.parent?.label ?? "Colombia"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Treemap + thematic cards (right) */}
        <div className="lg:w-8/12 flex flex-col gap-4">
          {subgrupoData.length >= 2 && (
            <div className="h-72 lg:h-96 w-full">
              <Treemap data={subgrupoData} height={300} />
            </div>
          )}

          {/* Thematic cards: Amenazadas nacional, Amenazadas global, CITES */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 border-t border-t-dartmouth-green pt-4">
            <ThemeBarCard
              title="Amenazadas nacional"
              total={grupo.especies_amenazadas_nacional_total}
              registros={grupo.registros_amenazadas_nacional_total}
              cr={grupo.especies_amenazadas_nacional_cr}
              en={grupo.especies_amenazadas_nacional_en}
              vu={grupo.especies_amenazadas_nacional_vu}
              speciesList={grupo.species_list_tematica?.["amenazadas-nacional"]}
            />
            <ThemeBarCard
              title="Amenazadas global"
              total={grupo.especies_amenazadas_global_total}
              registros={grupo.registros_amenazadas_global_total}
              cr={grupo.especies_amenazadas_global_cr}
              en={grupo.especies_amenazadas_global_en}
              vu={grupo.especies_amenazadas_global_vu}
              speciesList={grupo.species_list_tematica?.["amenazadas-global"]}
            />
            <CitesBarCard
              total={grupo.especies_cites_total}
              registros={grupo.registros_cites_total}
              i={grupo.especies_cites_i}
              ii={grupo.especies_cites_ii}
              iii={grupo.especies_cites_iii}
              speciesList={grupo.species_list_tematica?.["cites"]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================ */
/* Concentric circles style-2 (for ContentElement)              */
/* ============================================================ */

function ConcentricCardStyle2({ outer, inner }: { outer: number; inner: number }) {
  const radius = 28000;
  const outerSize = Math.sqrt(radius);
  const innerArea = outer > 0 ? (inner / outer) * radius : 0;
  const innerSize = Math.sqrt(innerArea);

  return (
    <div
      className="relative"
      style={{
        width: `${outerSize}px`,
        height: `${outerSize}px`,
        borderRadius: "50%",
        border: "1px solid black",
        backgroundColor: "#FFE0BB",
      }}
    >
      <div
        style={{
          width: `${innerSize}px`,
          height: `${innerSize}px`,
          borderRadius: "50%",
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          backgroundColor: "#5151F2",
        }}
      />
    </div>
  );
}

/* ============================================================ */
/* CR/EN/VU bar card                                            */
/* ============================================================ */

interface ThemeBarCardProps {
  title: string;
  total?: number | null;
  registros?: number | null;
  cr?: number | null;
  en?: number | null;
  vu?: number | null;
  speciesList?: SpeciesListItem[];
}

function ThemeBarCard({ title, total, registros, cr, en, vu, speciesList }: ThemeBarCardProps) {
  const crN = validateDifNa(cr);
  const enN = validateDifNa(en);
  const vuN = validateDifNa(vu);
  const sum = crN + enN + vuN;

  return (
    <div className="space-y-3 shadow-md flex flex-col py-5 px-4">
      <div>
        <p className="font-inter font-black text-3xl text-dartmouth-green">
          {formatNumber(total)}
        </p>
        <p className="text-xs text-gray-700">{title}</p>
      </div>
      <div className="flex justify-evenly text-xs">
        <ThreatStat color="bg-red-cr" label="CR" value={crN} />
        <ThreatStat color="bg-orange-en" label="EN" value={enN} />
        <ThreatStat color="bg-yellow-vu" label="VU" value={vuN} />
      </div>
      <div className="flex w-full h-3">
        <div className="bg-red-cr" style={{ width: calculateWidth(crN, sum) }} />
        <div className="bg-orange-en" style={{ width: calculateWidth(enN, sum) }} />
        <div className="bg-yellow-vu" style={{ width: calculateWidth(vuN, sum) }} />
      </div>
      <p className="text-xs text-blue-green">
        <strong>{formatNumber(registros)}</strong> Observaciones
      </p>
      {speciesList && speciesList.length > 0 && (
        <details className="text-xs">
          <summary className="cursor-pointer text-lemon">Ver especies</summary>
          <div className="mt-2"><SpeciesTable species={speciesList} /></div>
        </details>
      )}
    </div>
  );
}

function ThreatStat({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-1">
        <span className={`inline-block w-3 h-3 rounded-sm ${color}`} />
        <span className="font-bold">{label}</span>
      </div>
      <span>{formatNumber(value)}</span>
    </div>
  );
}

/* ============================================================ */
/* CITES card with I/II/III bar                                 */
/* ============================================================ */

interface CitesBarCardProps {
  total?: number | null;
  registros?: number | null;
  i?: number | null;
  ii?: number | null;
  iii?: number | null;
  speciesList?: SpeciesListItem[];
}

function CitesBarCard({ total, registros, i, ii, iii, speciesList }: CitesBarCardProps) {
  const iN = validateDifNa(i);
  const iiN = validateDifNa(ii);
  const iiiN = validateDifNa(iii);
  const sum = iN + iiN + iiiN;

  return (
    <div className="space-y-3 shadow-md flex flex-col py-5 px-4">
      <div>
        <p className="font-inter font-black text-3xl text-dartmouth-green">
          {formatNumber(total)}
        </p>
        <p className="text-xs text-gray-700">Especies CITES</p>
      </div>
      <div className="flex justify-evenly text-xs">
        <CitesStat color="bg-flame" label="Apéndice I" value={iN} />
        <CitesStat color="bg-blueberry" label="Apéndice II" value={iiN} />
        <CitesStat color="bg-lemon" label="Apéndice III" value={iiiN} />
      </div>
      <div className="flex w-full h-3">
        <div className="bg-flame" style={{ width: calculateWidth(iN, sum) }} />
        <div className="bg-blueberry" style={{ width: calculateWidth(iiN, sum) }} />
        <div className="bg-lemon" style={{ width: calculateWidth(iiiN, sum) }} />
      </div>
      <p className="text-xs text-blue-green">
        <strong>{formatNumber(registros)}</strong> Observaciones
      </p>
      {speciesList && speciesList.length > 0 && (
        <details className="text-xs">
          <summary className="cursor-pointer text-lemon">Ver especies</summary>
          <div className="mt-2"><SpeciesTable species={speciesList} /></div>
        </details>
      )}
    </div>
  );
}

function CitesStat({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-1">
        <span className={`inline-block w-3 h-3 rounded-sm ${color}`} />
        <span className="font-semibold text-[10px]">{label}</span>
      </div>
      <span>{formatNumber(value)}</span>
    </div>
  );
}
