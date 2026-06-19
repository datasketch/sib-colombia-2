import { useEffect, useState } from "react";

/**
 * The explorer's three-panel layout needs horizontal room. On a phone in
 * portrait (< md) we block it with a "rotate your phone" prompt and lock
 * page scroll; landscape or ≥ md gets the full layout. (Anexo §3.)
 */
export function MobileRotatePrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px) and (orientation: portrait)");
    const sync = () => setShow(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!show) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [show]);

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center gap-5 p-8 text-center"
    >
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="w-16 h-16 text-[#09A274] -rotate-90"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <rect x="7" y="2" width="10" height="20" rx="2" />
        <path d="M10.5 19.5h3" strokeLinecap="round" />
      </svg>
      <h2 className="text-lg font-bold text-[#09A274]">Rotar el teléfono para continuar</h2>
      <p className="max-w-xs text-sm text-gray-600">
        El explorador necesita más espacio horizontal. Gira tu dispositivo a modo
        horizontal para ver los filtros, las gráficas y la lista de especies.
      </p>
    </div>
  );
}
