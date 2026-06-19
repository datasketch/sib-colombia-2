import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useGlossary } from "../api/hooks";
import { Loading, ErrorBox } from "../components/layout/Loading";
import { HeadMore } from "../components/HeadMore";
import { useApp } from "../context/AppContext";

function normalize(s: string): string {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}

export function Glossary() {
  const { data, isLoading, error, refetch } = useGlossary();
  const { setFooterBgColor, setBreadCrumb } = useApp();
  const [params, setParams] = useSearchParams();
  const search = params.get("search") ?? "";

  useEffect(() => {
    setFooterBgColor("bg-footer-orange");
    setBreadCrumb([{ label: "Más" }, { label: "Glosario" }]);
  }, [setFooterBgColor, setBreadCrumb]);

  const setSearch = (q: string) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (q) next.set("search", q);
        else next.delete("search");
        return next;
      },
      { replace: true },
    );
  };

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = normalize(search);
    if (!q) return data;
    // Accent- and case-insensitive contains-search across term + body.
    // The "¿Cómo navegar?" buttons on /mas/acerca-de send unaccented
    // search terms (e.g. "tematicas") that must match accented entries
    // (e.g. "Temáticas").
    return data.filter(
      (item) =>
        normalize(item.termino).includes(q) ||
        normalize(item.definicion).includes(q),
    );
  }, [data, search]);

  return (
    <>
      <HeadMore title="Glosario" slug="glosario" />
      <div className="max-w-screen-2xl mx-auto">
        {/* Search bar — sized + positioned like legacy. */}
        <div className="mx-auto w-10/12 md:w-9/12">
          <div className="relative lg:w-1/5 pt-8">
            <img
              className="absolute top-[55%] left-3 h-6 w-6 pointer-events-none"
              src="/images/icons/search.svg"
              alt=""
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <input
              type="search"
              id="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar"
              className="block w-full focus:outline-none py-2 pl-12 pr-8 border border-black rounded-full font-lato"
            />
          </div>
        </div>

        {/* Two-column grid of definition cards, dotted-flame left rule. */}
        <div className="mx-auto w-10/12 md:w-9/12 grid md:grid-cols-2 gap-8 py-8">
          {isLoading && <Loading />}
          {error && <ErrorBox message={(error as Error).message} onRetry={() => refetch()} />}
          {filtered.map((item, i) => (
            <div
              key={`${item.termino}-${i}`}
              className="border-l-2 hover:bg-light-orange hover:bg-opacity-5 border-l-flame border-dotted space-y-3 px-3"
            >
              <h2 className="font-inter font-black text-xl">
                {item.termino}:
              </h2>
              <p className="font-lato">{item.definicion}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
