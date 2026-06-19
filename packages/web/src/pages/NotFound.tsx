import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";

export function NotFound() {
  const { setFooterBgColor, setBreadCrumb } = useApp();

  useEffect(() => {
    setFooterBgColor("bg-footer-green");
    setBreadCrumb([]);
  }, [setFooterBgColor, setBreadCrumb]);

  return (
    <div className="bg-gradient-to-b from-dartmouth-green via-blue-green to-dartmouth-green min-h-[calc(100vh-220px)] flex flex-col items-center justify-center text-white text-center px-6 pt-32 pb-16">
      <div className="bg-white/95 rounded-full w-24 h-24 flex items-center justify-center mb-8">
        <svg
          className="w-14 h-14 text-dartmouth-green"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <h1 className="font-barlow-condensed text-7xl lg:text-8xl font-bold leading-none">
        404
      </h1>
      <p className="text-2xl lg:text-3xl font-bold mt-2">Página no encontrada</p>
      <p className="text-sm lg:text-base mt-3 max-w-md">
        Lo sentimos, la página que busca no existe o ha sido movida.
      </p>

      <p className="mt-10 text-sm font-bold">Te sugerimos explorar:</p>
      <div className="mt-3 flex items-center gap-x-6 text-sm">
        <Link to="/" className="underline hover:text-yellow-green">
          Ir al inicio
        </Link>
        <span aria-hidden="true">|</span>
        <Link to="/colombia" className="underline hover:text-yellow-green">
          Ver Colombia
        </Link>
      </div>

      <p className="mt-10 max-w-lg text-xs lg:text-sm">
        Si crees que este es un error, puedes contactarnos a través de nuestro{" "}
        <a
          href="mailto:sib@humboldt.org.co"
          className="underline hover:text-yellow-green"
        >
          formulario de contacto
        </a>
        .
      </p>
    </div>
  );
}
