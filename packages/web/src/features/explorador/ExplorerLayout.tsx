import type { ReactNode } from "react";

interface Props {
  filters: ReactNode;
  viz: ReactNode;
  species: ReactNode;
}

const PANEL =
  "bg-white border border-gray-200 border-t-4 border-t-[#09A274] rounded px-5 py-5 shadow-default h-full flex flex-col";

/**
 * Three-panel "well" layout — 25/50/25, with the green top accent that
 * defines the look of org_sibhumboldt_sibdata_app4 (see www/custom.css).
 * Grid items stretch to the tallest row, and `h-full` on each panel
 * pushes the white card to fill so all three frames line up.
 */
export function ExplorerLayout({ filters, viz, species }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
      <aside className="md:col-span-3">
        <div className={PANEL}>{filters}</div>
      </aside>
      <section className="md:col-span-6">
        <div className={PANEL}>{viz}</div>
      </section>
      <aside className="md:col-span-3">
        <div className={PANEL}>{species}</div>
      </aside>
    </div>
  );
}
