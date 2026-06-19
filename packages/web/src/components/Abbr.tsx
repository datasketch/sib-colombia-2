import { type ReactNode, useEffect, useRef, useState } from "react";
import { acronymMeaning } from "../lib/acronyms";

interface Props {
  /** The acronym to explain, e.g. "CITES", "UICN". Looked up in acronyms.json. */
  sigla: string;
  /** Visible text. Defaults to `sigla`. */
  children?: ReactNode;
  /** Extra classes for the <abbr> (e.g. to match the surrounding label). */
  className?: string;
}

/**
 * Shows an acronym with its meaning available two ways (issue #32):
 *  - `<abbr title>` → native desktop hover tooltip + screen-reader semantics
 *  - tap/click → a small popover (same look as InfoTooltip) so touch users,
 *    who get no native `title` tooltip, can read it too
 *
 * Acronyms not present in acronyms.json render as plain text (no <abbr>), so
 * it's safe to wrap anything — unknown siglas are simply passed through.
 */
export function Abbr({ sigla, children, className = "" }: Props) {
  const meaning = acronymMeaning(sigla);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [open]);

  if (!meaning) return <>{children ?? sigla}</>;

  return (
    <span className="relative inline-flex" ref={ref}>
      <abbr
        title={meaning}
        aria-label={`${sigla}: ${meaning}`}
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((o) => !o);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        className={`cursor-help no-underline decoration-dotted underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-dartmouth-green ${className}`}
      >
        {children ?? sigla}
      </abbr>
      {open && (
        <span
          role="tooltip"
          className="absolute z-50 left-1/2 top-full mt-2 -translate-x-1/2 w-max max-w-[80vw] rounded-xl bg-white p-3 text-sm font-lato leading-relaxed text-black normal-case shadow-hard"
        >
          <span className="font-bold">{sigla}</span> — {meaning}
        </span>
      )}
    </span>
  );
}
