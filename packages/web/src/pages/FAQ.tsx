import { useEffect } from "react";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { useFAQ } from "../api/hooks";
import { Loading, ErrorBox } from "../components/layout/Loading";
import { HeadMore } from "../components/HeadMore";
import { useApp } from "../context/AppContext";

export function FAQ() {
  const { data, isLoading, error, refetch } = useFAQ();
  const { setFooterBgColor, setBreadCrumb } = useApp();

  useEffect(() => {
    setFooterBgColor("bg-footer-orange");
    setBreadCrumb([{ label: "Más" }, { label: "Preguntas frecuentes" }]);
  }, [setFooterBgColor, setBreadCrumb]);

  return (
    <>
      <HeadMore title="Preguntas frecuentes" slug="preguntas-frecuentes" />
      <div className="mx-auto max-w-screen-2xl w-11/12 lg:w-9/12 py-12 space-y-6">
        {isLoading && <Loading />}
        {error && <ErrorBox message={(error as Error).message} onRetry={() => refetch()} />}
        {data?.map((item, i) => (
          <div key={i} className="space-y-2">
            <div className="flex font-inter font-black space-x-3">
              <span>{i + 1}.</span>
              <h2>{item.pregunta}</h2>
            </div>
            <div className="px-7 font-lato space-y-1.5">
              <ReactMarkdown
                className="rc-markdown"
                components={{
                  a: ({ href, children, ...rest }) => {
                    const className = "text-azure underline italic";
                    // Internal links (e.g. /mas/metodologia) navigate client-side
                    // in the same tab; external links open in a new tab.
                    return href?.startsWith("/") ? (
                      <Link to={href} className={className}>
                        {children}
                      </Link>
                    ) : (
                      <a
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className={className}
                        {...rest}
                      >
                        {children}
                      </a>
                    );
                  },
                }}
              >
                {item.respuesta}
              </ReactMarkdown>
              <div className="w-1/6 border-b-2 border-b-flame border-dotted" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
