import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";

interface Props {
  label: string;
  src: string;
  id?: string;
  classname?: string;
  place?: "left" | "right" | "top" | "bottom";
}

/**
 * Info icon with hover tooltip showing markdown text.
 * Port of InfoTooltip.jsx — replaces react-tooltip with custom popover.
 */
export function InfoTooltip({ label, src, classname = "", place = "left" }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [open]);

  const placeClass = {
    left: "right-full top-1/2 -translate-y-1/2 mr-3",
    right: "left-full top-1/2 -translate-y-1/2 ml-3",
    top: "bottom-full left-1/2 -translate-x-1/2 mb-3",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-3",
  }[place];

  return (
    <div className={`relative inline-flex ${classname}`} ref={ref}>
      <button
        type="button"
        className="bg-white/30 rounded-full p-1 hover:bg-white/50 transition cursor-pointer"
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setOpen(true)}
        aria-label="Información"
      >
        <img className="w-4 h-4" src={src} alt="" />
      </button>
      {open && (
        <div
          className={`absolute z-50 bg-white text-black text-sm font-lato rounded-xl shadow-hard p-5 w-[420px] max-w-[90vw] leading-relaxed break-words ${placeClass}`}
          onMouseLeave={() => setOpen(false)}
        >
          <ReactMarkdown
            rehypePlugins={[rehypeRaw]}
            components={{
              p: ({ children }) => <span>{children}</span>,
              a: ({ href, children }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-dartmouth-green underline break-all"
                >
                  {children}
                </a>
              ),
            }}
          >
            {label}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}
