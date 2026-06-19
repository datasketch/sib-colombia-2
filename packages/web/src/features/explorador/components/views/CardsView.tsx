import { useMemo } from "react";
import { useExploradorStore } from "../../store";
import { useLabels, useSibdata } from "../../api";
import type { SibdataRow } from "../../types";

const INACTIVE_CARD =
  "flex-1 min-w-[180px] border border-gray-200 bg-gray-50 rounded-lg p-4 shadow-sm";
const ACTIVE_CARD =
  "flex-1 min-w-[180px] border border-[#4ad3ac] bg-[#F2FBF8] rounded-lg p-4 shadow-sm";
const INACTIVE_VALUE = "text-2xl font-bold text-gray-400 leading-none";
const ACTIVE_VALUE = "text-2xl font-bold text-[#09A274] leading-none";
const LABEL_CLS = "text-xs text-gray-500 mt-2";

/** Drop rows whose indicator is a marinas/continentales/salobres variant. */
function stripAmbiente(rows: SibdataRow[]): SibdataRow[] {
  return rows.filter((r) => !/marinas|continentales|salobres/.test(r.indicador));
}

/**
 * `null` count means "no data for this indicator in this grupo/region"
 * (e.g. amenazadas-global-ew for grupo=aves) — distinct from zero.
 * Rendering "0" would be misleading; rendering the card with "—" would
 * pad the view with noise. Skip these rows (and narrow the type so
 * downstream `formatNumber` doesn't need to re-check).
 */
function dropNullCounts(rows: SibdataRow[]): Array<SibdataRow & { count: number }> {
  return rows.filter(
    (r): r is SibdataRow & { count: number } => typeof r.count === "number",
  );
}

/** Display transform: "registros" → "observaciones" in card labels only. */
function observacionize(label: string): string {
  return label.replace(/registros/gi, "observaciones");
}

function tipoOf(ind: string): "registros" | "especies" {
  return ind.startsWith("registros_") ? "registros" : "especies";
}

function baseOf(ind: string): string {
  return ind.replace(/^(registros_|especies_)/, "");
}

function formatNumber(n: number): string {
  return n.toLocaleString("es-CO");
}

/**
 * No-tematica path: two fixed cards (registros / especies totals).
 */
function DefaultCards() {
  const region = useExploradorStore((s) => s.region);
  const grupo = useExploradorStore((s) => s.grupo);
  const tipo = useExploradorStore((s) => s.tipo);
  const indRegs = "registros_region_total";
  const indEsps = "especies_region_total";

  const qRegs = useSibdata(
    region ? { region, indicador: indRegs, grupo, subregiones: false } : null,
  );
  const qEsps = useSibdata(
    region ? { region, indicador: indEsps, grupo, subregiones: false } : null,
  );
  const labels = useLabels([indRegs, indEsps]);

  if (qRegs.isLoading || qEsps.isLoading) {
    return (
      <div
        className="flex gap-3 flex-wrap animate-pulse"
        aria-label="Cargando tarjetas"
        role="status"
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex-1 min-w-[180px] border border-gray-200 bg-gray-50 rounded-lg p-4"
          >
            <div className="h-7 bg-gray-200 rounded w-2/3 mb-2" />
            <div className="h-3 bg-gray-100 rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }
  if (qRegs.isError || qEsps.isError) {
    const msg = (qRegs.error ?? qEsps.error)?.message ?? "Error desconocido";
    return (
      <div className="border border-red-200 bg-red-50 text-red-800 p-3 rounded text-sm">
        <div className="font-semibold mb-1">Error al cargar tarjetas</div>
        <div className="font-mono text-xs break-all">{msg}</div>
        <button
          type="button"
          onClick={() => {
            void qRegs.refetch();
            void qEsps.refetch();
          }}
          className="mt-2 text-xs border border-red-300 text-red-800 rounded px-2 py-1 hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dartmouth-green"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const rowRegs = qRegs.data?.find((r) => r.indicador === indRegs);
  const rowEsps = qEsps.data?.find((r) => r.indicador === indEsps);
  const valRegs = rowRegs?.count ?? null;
  const valEsps = rowEsps?.count ?? null;
  const labelRegs = observacionize(labels.data?.[indRegs] ?? "Observaciones totales");
  const labelEsps = observacionize(labels.data?.[indEsps] ?? "Especies totales");
  const fmt = (v: number | null) => (v === null ? "—" : formatNumber(v));

  const especiesActive = tipo === "especies";

  return (
    <div className="flex gap-3 flex-wrap">
      <div className={especiesActive ? INACTIVE_CARD : ACTIVE_CARD}>
        <p className={especiesActive ? INACTIVE_VALUE : ACTIVE_VALUE}>{fmt(valRegs)}</p>
        <p className={LABEL_CLS}>{labelRegs}</p>
      </div>
      <div className={especiesActive ? ACTIVE_CARD : INACTIVE_CARD}>
        <p className={especiesActive ? ACTIVE_VALUE : INACTIVE_VALUE}>{fmt(valEsps)}</p>
        <p className={LABEL_CLS}>{labelEsps}</p>
      </div>
    </div>
  );
}

/**
 * Tematica path: fetch all_indicators=true, filter, sort, highlight.
 * Port of the `output$cards_viz` block in
 * the legacy reference:440-524.
 */
function TematicaCards() {
  const region = useExploradorStore((s) => s.region);
  const tematica = useExploradorStore((s) => s.tematica);
  const subtematica = useExploradorStore((s) => s.subtematica);
  const amenazadasCategoria = useExploradorStore((s) => s.amenazadasCategoria);
  const grupo = useExploradorStore((s) => s.grupo);
  const tipo = useExploradorStore((s) => s.tipo);
  const tematicaSlug = tematica ? tematica.replace(/-/g, "_") : null;

  const q = useSibdata(
    region && tematica
      ? {
          region,
          tematica: tematicaSlug,
          grupo,
          all_indicators: true,
          subregiones: false,
        }
      : null,
  );

  const allRows = useMemo(() => {
    const raw = q.data ?? [];
    const cleaned = dropNullCounts(stripAmbiente(raw));
    return [...cleaned].sort((a, b) => {
      const baseCmp = baseOf(a.indicador).localeCompare(baseOf(b.indicador));
      if (baseCmp !== 0) return baseCmp;
      return tipoOf(a.indicador) === "registros" ? -1 : 1;
    });
  }, [q.data]);

  // Issue #125: split aggregate `_total` indicators (registros_cites_total,
  // especies_cites_total, etc.) out of the subcategory grid so they can
  // be rendered as a distinct, visually elevated "Total" row above the
  // subcategory cards. Amenazadas already uses the `_total` suffix to
  // mean "all categories combined" so the same split applies there.
  const totalRows = useMemo(
    () => allRows.filter((r) => /_total$/.test(r.indicador)),
    [allRows],
  );
  const subcatRows = useMemo(
    () => allRows.filter((r) => !/_total$/.test(r.indicador)),
    [allRows],
  );

  const labelQuery = useLabels(allRows.map((r) => r.indicador));

  const subcatPattern = useMemo(() => {
    if (!tematica) return null;
    if (tematica.includes("amenazadas")) {
      if (!amenazadasCategoria || amenazadasCategoria === "_total") return null;
      return new RegExp(`${amenazadasCategoria}$`);
    }
    if ((tematica === "cites" || tematica === "exoticas-total") && subtematica) {
      const slug = subtematica.replace(/-/g, "_");
      return new RegExp(`${slug}$`);
    }
    return null;
  }, [tematica, subtematica, amenazadasCategoria]);

  const anySubPresent = subcatPattern
    ? subcatRows.some((r) => subcatPattern.test(r.indicador))
    : false;

  if (q.isLoading) return (
      <div
        className="flex gap-3 flex-wrap animate-pulse"
        aria-label="Cargando tarjetas"
        role="status"
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex-1 min-w-[180px] border border-gray-200 bg-gray-50 rounded-lg p-4"
          >
            <div className="h-7 bg-gray-200 rounded w-2/3 mb-2" />
            <div className="h-3 bg-gray-100 rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  if (q.isError) {
    return (
      <div className="border border-red-200 bg-red-50 text-red-800 p-3 rounded text-sm">
        <div className="font-semibold mb-1">Error al cargar tarjetas</div>
        <div className="font-mono text-xs break-all">
          {q.error?.message ?? "Error desconocido"}
        </div>
        <button
          type="button"
          onClick={() => void q.refetch()}
          className="mt-2 text-xs border border-red-300 text-red-800 rounded px-2 py-1 hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dartmouth-green"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (allRows.length === 0) {
    return (
      <div className="border border-[#4ad3ac] bg-[#F2FBF8] text-[#09A274] p-4 rounded-lg text-center">
        <div className="font-semibold text-lg">Los filtros no arrojaron resultados</div>
        <div className="text-sm mt-1">
          Por favor amplía la búsqueda con categorías más genéricas
        </div>
      </div>
    );
  }

  const renderCard = (r: SibdataRow & { count: number }) => {
    const activeByTipo = tipoOf(r.indicador) === tipo;
    const activeBySub = subcatPattern ? subcatPattern.test(r.indicador) : false;
    const isActive =
      subcatPattern && anySubPresent ? activeByTipo && activeBySub : activeByTipo;

    // No silent slug fallback — if /api/labels hasn't resolved yet
    // (hit empty branch) render the raw slug in monospace so the gap
    // is visible vs. an actual Spanish label.
    const rawLabel = labelQuery.data?.[r.indicador];
    const label = rawLabel ? observacionize(rawLabel) : null;

    return (
      <div key={r.indicador} className={isActive ? ACTIVE_CARD : INACTIVE_CARD}>
        <p className={isActive ? ACTIVE_VALUE : INACTIVE_VALUE}>{formatNumber(r.count)}</p>
        {label ? (
          <p className={LABEL_CLS}>{label}</p>
        ) : (
          <p className={`${LABEL_CLS} font-mono`}>{r.indicador}</p>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-3">
      {totalRows.length > 0 && (
        <div className="flex gap-3 flex-wrap">{totalRows.map(renderCard)}</div>
      )}
      {subcatRows.length > 0 && (
        <div className="flex gap-3 flex-wrap">{subcatRows.map(renderCard)}</div>
      )}
    </div>
  );
}

export function CardsView() {
  const tematica = useExploradorStore((s) => s.tematica);
  // Scroll container: the amenazadas case can render ~46 indicator cards,
  // which overflow the 450px chart slot — keep them scrollable in place.
  return (
    <div className="h-full overflow-auto pr-1">
      {tematica ? <TematicaCards /> : <DefaultCards />}
    </div>
  );
}
