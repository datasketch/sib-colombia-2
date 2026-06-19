import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  usePublishers,
  usePublisherFilters,
  usePublisherAggregates,
} from "../api/hooks";
import { Loading, ErrorBox } from "../components/layout/Loading";
import { formatNumber, capitalize } from "../lib/format";
import { HeadMore } from "../components/HeadMore";
import { useApp } from "../context/AppContext";
// @ts-expect-error legacy JSX
import InfoPublishers from "../components-legacy/InfoPublishers.jsx";
// @ts-expect-error legacy JSX
import PublishersCard from "../components-legacy/PublishersCard.jsx";

const PER_PAGE = 12;

export function Publishers() {
  const [params, setParams] = useSearchParams();

  // Default region = colombia (matches prod's default landing state).
  const region = params.get("region") ?? "colombia";
  const tipoOrg = params.get("tipo_organizacion") ?? "";
  const pais = params.get("pais") ?? "";
  const q = params.get("q") ?? "";
  const page = Math.max(1, Number(params.get("page") ?? 1));

  const { setFooterBgColor, setBreadCrumb } = useApp();
  useEffect(() => {
    setFooterBgColor("bg-footer-orange");
    setBreadCrumb([{ label: "Más" }, { label: "Publicadores" }]);
  }, [setFooterBgColor, setBreadCrumb]);

  const setParam = (key: string, value: string) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set(key, value);
        else next.delete(key);
        // Any filter change resets to page 1.
        if (key !== "page") next.delete("page");
        return next;
      },
      { replace: true },
    );
  };

  const clearFilters = () => setParams({}, { replace: true });

  const { data: filters } = usePublisherFilters();
  const { data: aggregates } = usePublisherAggregates({
    region,
    pais: pais || undefined,
    q: q || undefined,
  });
  const { data: pageData, isLoading, error, refetch } = usePublishers({
    region,
    tipo_organizacion: tipoOrg || undefined,
    pais: pais || undefined,
    q: q || undefined,
    page,
    per_page: PER_PAGE,
  });

  // Reshape aggregates into the InfoPublishers contract that the legacy
  // region pages already use, so we can reuse the same component.
  const infoData = useMemo(() => {
    if (!aggregates) return null;
    return {
      tipo_organizacion: aggregates.tipo_organizacion,
      registros_tipo_organizacion: aggregates.registros_tipo_organizacion,
    };
  }, [aggregates]);

  const totalPages = pageData
    ? Math.max(1, Math.ceil(pageData.total / pageData.per_page))
    : 1;

  return (
    <>
      <HeadMore
        title="Publicadores"
        slug="publicadores"
        description="Personas, organizaciones, iniciativas o redes de nivel local, nacional, regional o global que establecen mecanismos de cooperación con el SiB Colombia con el propósito de publicar datos e información. Gracias a los datos aportados por estas organizaciones es posible construir las cifras sobre biodiversidad que encuentras en Biodiversidad en cifras."
      />
      <div className="max-w-screen-2xl mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar — filters. Pill-shaped inputs + reset icons match prod. */}
          <aside className="lg:w-72 shrink-0 space-y-5">
            <FilterField
              label="Publicador"
              showReset={!!q}
              onReset={() => setParam("q", "")}
            >
              <img
                src="/images/icons/search.svg"
                alt=""
                className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 pointer-events-none opacity-70"
              />
              <input
                type="search"
                placeholder="Palabra clave"
                value={q}
                onChange={(e) => setParam("q", e.target.value)}
                className="w-full pl-12 pr-10 py-3 border border-black rounded-full text-base font-lato bg-white focus:outline-none"
              />
            </FilterField>

            <FilterField
              label="Región"
              isSelect
              showReset={region !== "colombia"}
              onReset={() => setParam("region", "")}
            >
              <select
                value={region}
                onChange={(e) => setParam("region", e.target.value)}
                className="w-full pl-5 pr-16 py-3 border border-black rounded-full text-base font-lato bg-white appearance-none focus:outline-none"
              >
                <option value="colombia">Colombia</option>
                {filters?.region
                  .filter((r) => r !== "colombia")
                  .map((r) => (
                    <option key={r} value={r}>
                      {capitalize(r.replace(/-/g, " "))}
                    </option>
                  ))}
              </select>
            </FilterField>

            <FilterField
              label="Tipo de Organización"
              isSelect
              showReset={!!tipoOrg}
              onReset={() => setParam("tipo_organizacion", "")}
            >
              <select
                value={tipoOrg}
                onChange={(e) => setParam("tipo_organizacion", e.target.value)}
                className="w-full pl-5 pr-16 py-3 border border-black rounded-full text-base font-lato bg-white appearance-none focus:outline-none"
              >
                <option value="">Selecciona una opción</option>
                {filters?.tipo_organizacion.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </FilterField>

            <FilterField
              label="País del Publicador"
              isSelect
              showReset={!!pais}
              onReset={() => setParam("pais", "")}
            >
              <select
                value={pais}
                onChange={(e) => setParam("pais", e.target.value)}
                className="w-full pl-5 pr-16 py-3 border border-black rounded-full text-base font-lato bg-white appearance-none focus:outline-none"
              >
                <option value="">Selecciona una opción</option>
                {filters?.pais_publicacion.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </FilterField>

            <button
              type="button"
              onClick={clearFilters}
              className="w-full bg-flame text-white font-inter font-bold py-3 rounded-full hover:bg-flame/90 flex items-center justify-center gap-2 cursor-pointer"
            >
              <img
                src="/images/icon-reset-white.svg"
                alt=""
                className="h-4 w-4"
              />
              Limpiar filtros
            </button>
          </aside>

          {/* Main column */}
          <div className="flex-1 min-w-0">
            {/* Totals + pies — same component used on the region pages */}
            {aggregates && infoData && (
              <InfoPublishers
                total={Array(aggregates.totals.total).fill(null)}
                data={{
                  tipo_organizacion: infoData.tipo_organizacion,
                  registros_tipo_organizacion: infoData.registros_tipo_organizacion,
                }}
                router="/mas/publicadores"
              />
            )}

            {/* Results grid */}
            <div className="mt-8">
              {isLoading && <Loading />}
              {error && <ErrorBox message={(error as Error).message} onRetry={() => refetch()} />}
              {pageData && (
                <>
                  <p className="text-sm text-gray-600 mb-4">
                    {pageData.total} publicador
                    {pageData.total === 1 ? "" : "es"}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {pageData.items.map((p, i) => (
                      <PublishersCard
                        key={`${p.slug_region}-${p.slug_publicador}-${i}`}
                        link={p.url_socio}
                        truncate
                        title={p.label}
                        imagePath={p.url_logo || "/images/un-icon.png"}
                        totalEspecies={p.especies}
                        observationsQuantity={p.registros}
                        country={p.pais_publicacion}
                      />
                    ))}
                  </div>
                  {totalPages > 1 && (
                    <Pagination
                      page={page}
                      totalPages={totalPages}
                      onChange={(n) => setParam("page", String(n))}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function FilterField({
  label,
  children,
  isSelect,
  showReset,
  onReset,
}: {
  label: string;
  children: React.ReactNode;
  isSelect?: boolean;
  showReset?: boolean;
  onReset?: () => void;
}) {
  return (
    <div>
      <label className="block font-inter font-black text-base text-black mb-2">
        {label}
      </label>
      <div className="relative">
        {children}
        {/* Down-arrow for native select (since appearance-none hides the
            default UA caret). Sits to the left of the reset icon. */}
        {isSelect && (
          <span
            aria-hidden="true"
            className="absolute right-12 top-1/2 -translate-y-1/2 text-base font-bold pointer-events-none"
          >
            ↓
          </span>
        )}
        {/* Reset icon — visible only when the field has a non-default value.
            Slot occupies a fixed slot to mirror the prod layout. */}
        <button
          type="button"
          onClick={onReset}
          aria-label={`Limpiar ${label}`}
          className={`absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer ${
            showReset ? "opacity-70 hover:opacity-100" : "opacity-30"
          }`}
          tabIndex={showReset ? 0 : -1}
        >
          <img
            src="/images/icon-reset-black.svg"
            alt=""
            className="h-4 w-4"
          />
          {/* Vertical divider matches the prod field. */}
          <span
            aria-hidden="true"
            className="absolute -left-2 top-1/2 -translate-y-1/2 h-4 border-l border-black/40"
          />
        </button>
      </div>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (n: number) => void;
}) {
  // Show a windowed range like 1 … 4 5 6 … 49 (max 7 numbers visible).
  const window = pageWindow(page, totalPages);

  return (
    <div className="flex justify-center items-center gap-1 mt-10 text-sm font-lato">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="px-3 py-1 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
      >
        ‹
      </button>
      {window.map((n, i) =>
        n === null
          ? (
            <span key={`gap-${i}`} className="px-2 text-gray-400">…</span>
          )
          : (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={`px-3 py-1 rounded-full cursor-pointer ${
                n === page
                  ? "bg-dartmouth-green text-white font-bold"
                  : "hover:bg-gray-100"
              }`}
            >
              {n}
            </button>
          ),
      )}
      <button
        type="button"
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="px-3 py-1 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
      >
        ›
      </button>
    </div>
  );
}

function pageWindow(page: number, total: number): (number | null)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | null)[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(total - 1, page + 1);
  if (start > 2) out.push(null);
  for (let n = start; n <= end; n++) out.push(n);
  if (end < total - 1) out.push(null);
  out.push(total);
  return out;
}
