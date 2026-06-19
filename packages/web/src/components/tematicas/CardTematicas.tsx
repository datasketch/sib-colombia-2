import type { TematicaSection, SpeciesListItem } from "../../api/types";
import { formatNumber, validateDifNa, calculateWidth, capitalize } from "../../lib/format";
import { SpeciesTable } from "../common/SpeciesTable";

interface Props {
  section: TematicaSection;
}

/**
 * Renders a tematica section with the appropriate layout based on its slug.
 * Port of CardTematicas.jsx — switches between amenazadas, cites, endemicas,
 * migratorias, exoticas layouts.
 */
export function CardTematicas({ section }: Props) {
  const slug = section.slug.toLowerCase();

  if (slug === "amenazadas") {
    return <AmenazadasCard section={section} />;
  }
  if (slug.startsWith("cites")) {
    return <CitesCard section={section} />;
  }
  if (slug === "endemicas") {
    return <SimpleCard section={section} label="Endémicas" />;
  }
  if (slug === "migratorias") {
    return <SimpleCard section={section} label="Migratorias" />;
  }
  if (slug.startsWith("exoticas")) {
    return <ExoticasCard section={section} />;
  }
  if (slug === "amenazadas-nacional" || slug === "amenazadas-global") {
    return <AmenazadasDetailCard section={section} isGlobal={slug === "amenazadas-global"} />;
  }

  return <FallbackCard section={section} />;
}

/* ============================================================ */
/* Amenazadas (Top level — has children for nacional + global) */
/* ============================================================ */

function AmenazadasCard({ section }: Props) {
  if (!section.children || section.children.length === 0) {
    return <FallbackCard section={section} />;
  }
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {section.children.map((child) => {
        const cr = validateDifNa(child.cr);
        const en = validateDifNa(child.en);
        const vu = validateDifNa(child.vu);
        const total = cr + en + vu;
        const isGlobal = child.slug.includes("global");
        return (
          <div key={child.slug} className="bg-white rounded-lg shadow-default p-6">
            <p className="text-sm text-gray-500">
              Categoría {isGlobal ? "UICN Global" : "Nacional"}
            </p>
            <p className="font-inter text-5xl font-black text-dartmouth-green my-2">
              {formatNumber(child.especies)}
            </p>
            <p className="font-inter text-lg font-bold mb-4">
              Especies amenazadas
            </p>
            <div className="flex justify-evenly gap-4 mb-2">
              <ThreatStat label="CR" color="bg-red-cr" value={cr} />
              <ThreatStat label="EN" color="bg-orange-en" value={en} />
              <ThreatStat label="VU" color="bg-yellow-vu" value={vu} />
            </div>
            <div className="flex h-3 rounded overflow-hidden">
              <div className="bg-red-cr" style={{ width: calculateWidth(cr, total) }} />
              <div className="bg-orange-en" style={{ width: calculateWidth(en, total) }} />
              <div className="bg-yellow-vu" style={{ width: calculateWidth(vu, total) }} />
            </div>
            <p className="text-sm text-blue-green mt-3">
              <strong>{formatNumber(child.registros)}</strong> observaciones
            </p>
            {child.species_list && child.species_list.length > 0 && (
              <details className="mt-4">
                <summary className="text-sm cursor-pointer text-lemon">
                  Ver especies
                </summary>
                <div className="mt-3">
                  <SpeciesTable species={child.species_list} />
                </div>
              </details>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ThreatStat({ label, color, value }: { label: string; color: string; value: number }) {
  return (
    <div className="flex flex-col items-center text-sm">
      <div className="flex items-center gap-1">
        <span className={`inline-block w-4 h-4 rounded ${color}`} />
        <span className="font-bold">{label}</span>
      </div>
      <span>{formatNumber(value)}</span>
    </div>
  );
}

/* ============================================================ */
/* Amenazadas detail (single category drill-down) */
/* ============================================================ */

function AmenazadasDetailCard({ section, isGlobal }: { section: TematicaSection; isGlobal: boolean }) {
  const cr = validateDifNa(section.cr);
  const en = validateDifNa(section.en);
  const vu = validateDifNa(section.vu);
  const total = cr + en + vu;
  const especies = section.especies as number | undefined;
  const registros = section.registros as number | undefined;
  const speciesList = (section.list_especies_amenazadas_nacional ??
    section.list_especies_amenazadas_global ??
    []) as SpeciesListItem[];

  return (
    <div className="bg-white rounded-lg shadow-default p-6">
      <p className="text-sm text-gray-500">
        Amenazadas {isGlobal ? "global" : "nacional"}
      </p>
      <p className="font-inter text-5xl font-black text-dartmouth-green my-2">
        {formatNumber(especies)}
      </p>
      <div className="flex justify-evenly gap-4 mb-2">
        <ThreatStat label="CR" color="bg-red-cr" value={cr} />
        <ThreatStat label="EN" color="bg-orange-en" value={en} />
        <ThreatStat label="VU" color="bg-yellow-vu" value={vu} />
      </div>
      <div className="flex h-3 rounded overflow-hidden">
        <div className="bg-red-cr" style={{ width: calculateWidth(cr, total) }} />
        <div className="bg-orange-en" style={{ width: calculateWidth(en, total) }} />
        <div className="bg-yellow-vu" style={{ width: calculateWidth(vu, total) }} />
      </div>
      {registros != null && (
        <p className="text-sm text-blue-green mt-3">
          <strong>{formatNumber(registros)}</strong> observaciones
        </p>
      )}
      {speciesList.length > 0 && (
        <div className="mt-4">
          <SpeciesTable species={speciesList} />
        </div>
      )}
    </div>
  );
}

/* ============================================================ */
/* CITES */
/* ============================================================ */

function CitesCard({ section }: Props) {
  const i = validateDifNa(section.especies_cites_i);
  const ii = validateDifNa(section.especies_cites_ii);
  const iii = validateDifNa(section.especies_cites_iii);
  const total = validateDifNa(section.especies_cites_total) || (i + ii + iii);
  const speciesList = (section.species_list ?? []) as SpeciesListItem[];

  return (
    <div className="bg-white rounded-lg shadow-default p-6">
      <p className="text-sm text-gray-500">CITES</p>
      <p className="font-inter text-5xl font-black text-dartmouth-green my-2">
        {formatNumber(total)}
      </p>
      <p className="text-sm font-bold mb-4">Especies en CITES</p>
      <div className="grid grid-cols-3 gap-2 text-center text-sm mb-2">
        <CitesAppendix label="I" value={i} color="bg-flame" />
        <CitesAppendix label="II" value={ii} color="bg-blueberry" />
        <CitesAppendix label="III" value={iii} color="bg-lemon" />
      </div>
      <div className="flex h-3 rounded overflow-hidden">
        <div className="bg-flame" style={{ width: calculateWidth(i, i + ii + iii) }} />
        <div className="bg-blueberry" style={{ width: calculateWidth(ii, i + ii + iii) }} />
        <div className="bg-lemon" style={{ width: calculateWidth(iii, i + ii + iii) }} />
      </div>
      {speciesList.length > 0 && (
        <details className="mt-4">
          <summary className="text-sm cursor-pointer text-lemon">Ver especies</summary>
          <div className="mt-3"><SpeciesTable species={speciesList} /></div>
        </details>
      )}
    </div>
  );
}

function CitesAppendix({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className={`inline-block w-4 h-4 rounded ${color}`} />
      <span className="font-bold">Apéndice {label}</span>
      <span>{formatNumber(value)}</span>
    </div>
  );
}

/* ============================================================ */
/* Simple (endemicas / migratorias) */
/* ============================================================ */

function SimpleCard({ section, label }: { section: TematicaSection; label: string }) {
  const especies = section.especies_endemicas ?? section.especies_migratorias;
  const registros = section.registros_endemicas ?? section.registros_migratorias;
  const speciesList = (section.species_list ?? []) as SpeciesListItem[];
  return (
    <div className="bg-white rounded-lg shadow-default p-6">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="font-inter text-5xl font-black text-dartmouth-green my-2">
        {formatNumber(especies as number | null)}
      </p>
      <p className="text-sm font-bold">Especies {label.toLowerCase()}</p>
      {registros != null && (
        <p className="text-sm text-blue-green mt-2">
          <strong>{formatNumber(registros as number)}</strong> observaciones
        </p>
      )}
      {speciesList.length > 0 && (
        <details className="mt-4">
          <summary className="text-sm cursor-pointer text-lemon">Ver especies</summary>
          <div className="mt-3"><SpeciesTable species={speciesList} /></div>
        </details>
      )}
    </div>
  );
}

/* ============================================================ */
/* Exóticas */
/* ============================================================ */

function ExoticasCard({ section }: Props) {
  const total = validateDifNa(section.especies_exoticas_total);
  const exoticas = validateDifNa(section.especies_exoticas);
  const invasoras = validateDifNa(section.especies_invasoras);
  const trasplantadas = validateDifNa(section.especies_trasplantadas);
  const riesgo = validateDifNa(section.especies_exoticas_riesgo_invasion_total);

  return (
    <div className="bg-white rounded-lg shadow-default p-6">
      <p className="text-sm text-gray-500">Exóticas</p>
      <p className="font-inter text-5xl font-black text-dartmouth-green my-2">
        {formatNumber(total)}
      </p>
      <ul className="text-sm space-y-1 mt-4">
        <li><strong>{formatNumber(exoticas)}</strong> exóticas</li>
        <li><strong>{formatNumber(invasoras)}</strong> invasoras</li>
        <li><strong>{formatNumber(trasplantadas)}</strong> trasplantadas</li>
        <li><strong>{formatNumber(riesgo)}</strong> con riesgo de invasión</li>
      </ul>
    </div>
  );
}

/* ============================================================ */
/* Fallback */
/* ============================================================ */

function FallbackCard({ section }: Props) {
  return (
    <div className="bg-white rounded-lg shadow-default p-6">
      <p className="font-bold text-dartmouth-green capitalize">
        {section.label ?? capitalize(section.slug)}
      </p>
    </div>
  );
}
