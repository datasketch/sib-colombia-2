import { Fragment, useEffect, useRef, useState } from "react";

interface PositionInfo {
  position: number;
  suffix: string;
  position_text: string;
}

interface RefInfo {
  ref_id: number;
  label: string;
  zotero?: string;
}

interface Props {
  info: PositionInfo;
  refs: RefInfo[];
}

/**
 * Card showing one of Colombia's biodiversity rankings.
 * Port of CardRank.jsx — parses position_text for "word (123 | 456)" patterns
 * and replaces them with hover-tooltip labels.
 */
export function CardRank({ info, refs }: Props) {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  const regex = /([a-zA-ZáéíóúÁÉÍÓÚñÑ]+)\s*\(([^)]+)\)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(info.position_text)) !== null) {
    const [fullMatch, word, numbersString] = match;
    const beforeMatch = info.position_text.slice(lastIndex, match.index);
    if (beforeMatch) parts.push(<Fragment key={`b-${lastIndex}`}>{beforeMatch}</Fragment>);

    const numbers = numbersString.split("|").map((n) => n.trim());
    const matchingRefs = numbers
      .map((n) => refs.find(({ ref_id }) => +ref_id === +n))
      .filter(Boolean) as RefInfo[];

    if (matchingRefs.length > 0) {
      parts.push(
        <RefTooltip key={`m-${match.index}`} word={word} refs={matchingRefs} />
      );
    } else {
      parts.push(<Fragment key={`m-${match.index}`}>{fullMatch}</Fragment>);
    }
    lastIndex = match.index + fullMatch.length;
  }

  const tail = info.position_text.slice(lastIndex);
  if (tail) parts.push(<Fragment key={`t-${lastIndex}`}>{tail}</Fragment>);

  return (
    <div>
      <div className="flex items-center gap-2">
        <div className="text-4xl lg:text-5xl font-bold">{info.position}</div>
        <div>
          <div className="text-sm lg:text-base">{info.suffix}</div>
          <p className="capitalize text-lg lg:text-xl">país</p>
        </div>
      </div>
      <div className="mt-1 inline-block max-w-xs text-sm lg:text-base">
        {parts}
      </div>
    </div>
  );
}

/**
 * Inline tooltip that mirrors the photo-credit InfoTooltip — opens a
 * popover with full reference text the user can select and copy. Stays
 * open while the cursor is inside (hover *or* click), closes on outside
 * click. The native `title` attr alone is not selectable, which made
 * citations un-copyable.
 */
function RefTooltip({ word, refs }: { word: string; refs: RefInfo[] }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    // capture phase: React re-renders before bubble, which would detach
    // e.target from the DOM and make contains() return false.
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, [open]);

  return (
    <span
      ref={containerRef}
      className="relative inline-block"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={(e) => {
        // Don't close if moving into the popover itself.
        const next = e.relatedTarget as Node | null;
        if (next && containerRef.current?.contains(next)) return;
        setOpen(false);
      }}
    >
      <span
        className="font-bold cursor-help hover:underline"
        onClick={() => setOpen((v) => !v)}
      >
        {word}
      </span>
      {open && (
        <span
          role="tooltip"
          className="absolute left-0 top-full mt-2 z-50 block w-[min(28rem,90vw)] bg-white text-black text-xs leading-relaxed rounded shadow-lg border border-gray-200 p-3 whitespace-pre-line cursor-text select-text font-normal normal-case"
        >
          {refs.map((r, i) => (
            <span key={r.ref_id} className="block">
              {i > 0 && <span className="block h-2" aria-hidden="true" />}
              {r.label}
            </span>
          ))}
        </span>
      )}
    </span>
  );
}
