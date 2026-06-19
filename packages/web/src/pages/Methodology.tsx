import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
// remark-gfm provides GitHub-flavored markdown (tables, strikethrough, etc.).
// Imported via esm.sh so the dev server can fetch it on first request without
// requiring the deno.json import map to have been resolved before startup.
// @ts-expect-error npm-shaped module resolved by Vite at runtime
import remarkGfm from "https://esm.sh/remark-gfm@4";
import { useQuery } from "@tanstack/react-query";
import { Loading, ErrorBox } from "../components/layout/Loading";
import { HeadMore } from "../components/HeadMore";
import { useApp } from "../context/AppContext";

const MD_URL = "/data/info/methodology.md";
const PDF_URL =
  "/files/Biodiversidad En Cifras_ Ficha metodológica (2025).pdf";
const ZOTERO_URL =
  "https://www.zotero.org/groups/4455905/biodiversidadencifras/library";

interface Heading {
  level: 1 | 2;
  text: string;
  id: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

function stripAnchorSuffix(text: string): string {
  // Markdown sometimes carries Pandoc-style {#anchor-id} suffixes — strip
  // them so the rendered title doesn't show the raw syntax.
  return text.replace(/\s*\{#[^}]*\}\s*$/, "");
}

function parseHeadings(md: string): Heading[] {
  const out: Heading[] = [];
  const seen = new Set<string>();
  for (const raw of md.split("\n")) {
    const m1 = raw.match(/^# (.+)$/);
    const m2 = !m1 ? raw.match(/^## (.+)$/) : null;
    const m = m1 ?? m2;
    if (!m) continue;
    const text = stripAnchorSuffix(m[1].trim());
    if (!text) continue;
    let id = slugify(text);
    if (!id) continue;
    // Ensure uniqueness across duplicated section names.
    let unique = id;
    let i = 2;
    while (seen.has(unique)) unique = `${id}-${i++}`;
    seen.add(unique);
    out.push({ level: m1 ? 1 : 2, text, id: unique });
  }
  return out;
}

function getTextFromChildren(children: unknown): string {
  if (children == null) return "";
  if (typeof children === "string") return children;
  if (typeof children === "number") return String(children);
  if (Array.isArray(children)) {
    return children.map(getTextFromChildren).join("");
  }
  // deno-lint-ignore no-explicit-any
  const c = children as any;
  if (c?.props?.children) return getTextFromChildren(c.props.children);
  return "";
}

export function Methodology() {
  const { setFooterBgColor, setBreadCrumb } = useApp();
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    setFooterBgColor("bg-footer-orange");
    setBreadCrumb([{ label: "Más" }, { label: "Metodología" }]);
  }, [setFooterBgColor, setBreadCrumb]);

  const { data: markdown, isLoading, error, refetch } = useQuery({
    queryKey: ["methodology-md"],
    queryFn: async () => {
      const res = await fetch(MD_URL);
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      return res.text();
    },
    staleTime: Infinity,
  });

  const headings = useMemo(
    () => (markdown ? parseHeadings(markdown) : []),
    [markdown],
  );

  // Manual scrollspy (mirrors the legacy implementation).
  useEffect(() => {
    if (headings.length === 0) return;
    const ids = headings.map((h) => h.id);
    const onScroll = () => {
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (r.top <= 150 && r.bottom >= 150) {
          setActiveId(id);
          return;
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [headings]);

  return (
    <>
      <HeadMore title="Metodología" slug="metodologia" />
      <div className="max-w-screen-2xl w-10/12 mx-auto flex">
        <div className="space-y-4 lg:space-y-12 mx-auto md:w-8/12 py-10">
          {isLoading && <Loading />}
          {error && <ErrorBox message={(error as Error).message} onRetry={() => refetch()} />}
          {markdown && (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              className="rc-markdown font-lato space-y-4"
              // react-markdown v9 passes the hast `node` to every component;
              // we strip it (node: _node) so it isn't spread via {...props}
              // onto the DOM element, where React would serialize it as
              // node="[object Object]" and bloat the SSR output (#30).
              components={{
                h1: ({ children, node: _node, ...props }) => {
                  const text = stripAnchorSuffix(getTextFromChildren(children));
                  const match = headings.find(
                    (h) => h.text === text && h.level === 1,
                  );
                  const id = match?.id ?? slugify(text);
                  return (
                    <div className="space-y-2 lg:space-y-4">
                      <div className="w-1/3 border-t-2 border-t-flame border-dotted" />
                      <h1
                        id={id}
                        className="text-flame font-inter text-2xl font-black"
                        {...props}
                      >
                        {text}
                      </h1>
                    </div>
                  );
                },
                h2: ({ children, node: _node, ...props }) => {
                  const text = stripAnchorSuffix(getTextFromChildren(children));
                  const match = headings.find(
                    (h) => h.text === text && h.level === 2,
                  );
                  const id = match?.id ?? slugify(text);
                  return (
                    <h2
                      id={id}
                      className="font-bold text-xl font-inter"
                      {...props}
                    >
                      {text}
                    </h2>
                  );
                },
                img: ({ src, alt, node: _node, ...props }) => {
                  // The legacy Pandoc export emits placeholder image refs
                  // like `![][image1]` and a base64 data URI for the table.
                  // Map them to the bundled assets.
                  if (
                    src &&
                    (src.includes("diagrama-metodologia") ||
                      src.startsWith("data:image/png"))
                  ) {
                    return (
                      <img
                        className="mx-auto"
                        src="/images/metodologia.png"
                        alt={alt || "Diagrama de metodología"}
                        {...props}
                      />
                    );
                  }
                  if (src && src.includes("tabla-metodologia")) {
                    return (
                      <img
                        className="mx-auto"
                        src="/images/tabla-metodologia.svg"
                        alt={alt || "Tabla de metodología"}
                        {...props}
                      />
                    );
                  }
                  return <img src={src} alt={alt} {...props} />;
                },
                table: ({ children, node: _node, ...props }) => (
                  <div className="overflow-x-auto">
                    <table
                      className="min-w-full border-collapse border border-gray-300"
                      {...props}
                    >
                      {children}
                    </table>
                  </div>
                ),
                th: ({ children, node: _node, ...props }) => (
                  <th
                    className="border border-gray-300 px-4 py-2 bg-gray-100 font-bold text-left"
                    {...props}
                  >
                    {children}
                  </th>
                ),
                td: ({ children, node: _node, ...props }) => (
                  <td className="border border-gray-300 px-4 py-2" {...props}>
                    {children}
                  </td>
                ),
                ul: ({ children, node: _node, ...props }) => (
                  <ul className="px-6 space-y-6 py-3" {...props}>
                    {children}
                  </ul>
                ),
                li: ({ children, node: _node, ...props }) => (
                  <li className="flex font-lato" {...props}>
                    <img
                      className="pr-3 self-start pt-2"
                      src="/images/arrow-black.svg"
                      alt=""
                    />
                    <div className="rc-markdown font-lato">{children}</div>
                  </li>
                ),
                p: ({ children, node: _node, ...props }) => (
                  <p className="font-lato" {...props}>
                    {children}
                  </p>
                ),
                strong: ({ children, node: _node, ...props }) => (
                  <b className="font-inter" {...props}>
                    {children}
                  </b>
                ),
                a: ({ children, href, node: _node, ...props }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-green underline hover:text-flame"
                    {...props}
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {markdown}
            </ReactMarkdown>
          )}

          {markdown && (
            <div className="space-y-2 lg:space-y-4 pt-8">
              <div className="w-1/3 border-t-2 border-t-flame border-dotted" />
              <h2 className="text-flame font-inter text-2xl font-black pt-4">
                Descarga y bibliografía
              </h2>
              <div className="flex flex-col md:flex-row gap-5">
                <a
                  className="flex justify-center items-center gap-2 py-1 lg:w-4/12 px-2 border border-black rounded-full"
                  href={PDF_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="text-base font-lato">
                    Descargar la metodología
                  </span>
                  <img
                    className="w-3 h-4"
                    src="/images/icon-download.svg"
                    alt=""
                  />
                </a>
                <a
                  className="flex justify-center items-center gap-2 py-1 lg:w-4/12 px-1.5 border border-black rounded-full"
                  href={ZOTERO_URL}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="text-base font-lato">
                    Conocer la bibliografía
                  </span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar TOC */}
        <div className="py-10 w-3/12 mx-auto hidden md:block">
          <span className="font-black font-inter py-2">Contenidos</span>
          {headings.length > 0 && (
            <ul className="space-y-1.5 sticky top-[5%] font-lato">
              {headings.map((h) => (
                <li
                  key={h.id}
                  className={`hover:bg-[#8080801A] hover:border-l-2 hover:border-l-[#707070] ${
                    h.level === 1 ? "pl-2" : "pl-4"
                  } ${activeId === h.id ? "border-l-2 border-flame" : ""}`}
                >
                  <a className="p-1.5 block text-sm" href={`#${h.id}`}>
                    {h.text}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
