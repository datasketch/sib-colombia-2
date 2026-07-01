import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { navigationData, type NavItem } from "../../lib/navigation";
import { RegionSearchBox } from "./RegionSearchBox";

interface Props {
  /** Use solid background instead of transparent (for non-banner pages) */
  solid?: boolean;
}

export function Navbar({ solid = false }: Props = {}) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const containerRef = useRef<HTMLElement>(null);
  const location = useLocation();

  // Close on route change
  useEffect(() => {
    setOpenIdx(null);
    setMobileOpen(false);
  }, [location.pathname]);

  // Close on click outside (capture phase: read target before React re-renders)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpenIdx(null);
      }
    };
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, []);

  return (
    <header
      ref={containerRef}
      className={`absolute top-0 left-0 w-full z-50 py-2 ${
        solid ? "bg-dartmouth-green" : ""
      }`}
    >
      <div className="mx-auto w-10/12 max-w-[1300px]">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img
              className="min-h-[40px] min-w-[140px] w-1/2 max-w-[200px]"
              src="/images/logo-biodiversidadcifras.svg"
              alt="Biodiversidad en Cifras"
            />
          </Link>

          {/* Desktop nav — grid-cols-4 matches legacy for evenly-spaced items */}
          <nav className="hidden lg:block self-end pb-2">
            <ul className="grid grid-cols-4 gap-x-6 text-white items-center">
              {navigationData.map((item, i) => (
                <NavItemView
                  key={item.label}
                  item={item}
                  open={openIdx === i}
                  onToggle={() => setOpenIdx(openIdx === i ? null : i)}
                />
              ))}
            </ul>
          </nav>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden text-white p-2 cursor-pointer"
            aria-label="Menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileOpen ? (
                <path d="M6 6l12 12M6 18L18 6" />
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
        <div className="border-b border-white/40 mt-2"></div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden bg-dartmouth-green text-white w-full max-h-[80vh] overflow-y-auto">
          <ul className="px-6 py-4 space-y-1">
            {navigationData.map((item) => (
              <MobileNavItem key={item.label} item={item} />
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}

function NavItemView({
  item,
  open,
  onToggle,
}: {
  item: NavItem;
  open: boolean;
  onToggle: () => void;
}) {
  const hasChildren = !!item.childs?.length;

  if (!hasChildren) {
    return (
      <li>
        <Link
          to={item.href}
          className="font-lato text-sm hover:text-yellow-green transition"
        >
          {item.label}
        </Link>
      </li>
    );
  }

  return (
    <li className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="font-lato text-sm hover:text-yellow-green transition flex items-center gap-x-2 cursor-pointer"
      >
        {item.label}
        <img
          src="/images/arrow-white.svg"
          alt=""
          className={`h-2.5 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <div className="absolute top-[calc(100%+0.5rem)] right-0 z-50">
          {item.label === "Regiones" ? (
            <RegionsMega item={item} />
          ) : (
            <SimpleDropdown item={item} />
          )}
        </div>
      )}
    </li>
  );
}

function SimpleDropdown({ item }: { item: NavItem }) {
  return (
    <div className="bg-white shadow-default rounded-lg text-black min-w-[220px] py-3 animate-fade-in">
      {item.childs?.map((sub) => {
        const href = sub.children?.[0]?.href ?? "#";
        return (
          <Link
            key={sub.label}
            to={href}
            className="block px-5 py-2 text-sm font-lato hover:bg-gray-50 hover:font-bold hover:text-flame"
          >
            {sub.label}
          </Link>
        );
      })}
    </div>
  );
}

function RegionsMega({ item }: { item: NavItem }) {
  // Expanded state lives here so the panel width tracks the browse depth and
  // holds steady while searching — typing inside the wide 4-column grid keeps
  // the wide panel instead of snapping to a narrow search box.
  const [expandedSub, setExpandedSub] = useState<string | null>(null);
  const expandedCount =
    item.childs?.find((s) => s.label === expandedSub)?.children?.length ?? 0;
  const wide = expandedCount > 6;

  return (
    <div
      className={`bg-white shadow-default rounded-lg text-black px-5 py-4 animate-fade-in ${
        wide ? "w-[725px]" : "w-[360px]"
      }`}
    >
      <RegionSearchBox
        variant="desktop"
        browse={
          <RegionBrowse
            item={item}
            expandedSub={expandedSub}
            setExpandedSub={setExpandedSub}
          />
        }
      />
    </div>
  );
}

/** Category drill-down — the menu's default view when the search box is empty. */
function RegionBrowse({
  item,
  expandedSub,
  setExpandedSub,
}: {
  item: NavItem;
  expandedSub: string | null;
  setExpandedSub: (v: string | null) => void;
}) {
  if (expandedSub) {
    const entries =
      item.childs?.find((s) => s.label === expandedSub)?.children ?? [];
    return (
      <div>
        <button
          type="button"
          onClick={() => setExpandedSub(null)}
          className="flex items-center gap-x-2 text-xs font-lato text-dartmouth-green hover:font-bold mb-3 cursor-pointer"
        >
          <img
            src="/images/arrow-green-icon.svg"
            alt=""
            className="h-3 rotate-180"
          />
          {expandedSub}
        </button>
        <RegionGrid entries={entries} />
      </div>
    );
  }

  return (
    <ul>
      {item.childs?.map((sub) => (
        <li key={sub.label}>
          <button
            type="button"
            onClick={() => setExpandedSub(sub.label)}
            className="flex items-center justify-between w-full text-left px-1 py-2 text-sm font-lato hover:font-bold hover:text-dartmouth-green whitespace-nowrap cursor-pointer"
          >
            {sub.label}
            <img
              src="/images/arrow-green-icon.svg"
              alt=""
              className="h-3 ml-6"
            />
          </button>
        </li>
      ))}
    </ul>
  );
}

function RegionGrid({
  entries,
}: {
  entries: { label: string; href: string }[];
}) {
  if (entries.length === 0) return null;

  const useGrid = entries.length > 6;
  const cols = useGrid ? 4 : 1;
  const colSize = Math.ceil(entries.length / cols);
  const columns = Array.from({ length: cols }, (_, i) =>
    entries.slice(i * colSize, (i + 1) * colSize)
  );

  return (
    <div
      className={`grid ${
        useGrid ? "grid-cols-4 gap-x-6" : "grid-cols-1"
      } gap-y-2 text-sm font-lato`}
    >
      {columns.map((col, i) => (
        <div key={i} className="flex flex-col gap-y-2">
          {col.map((r) => (
            <Link
              key={r.href}
              to={r.href === "#" ? "#" : r.href}
              className={
                r.href === "#"
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-black cursor-pointer hover:font-bold hover:text-dartmouth-green hover:underline"
              }
              onClick={r.href === "#" ? (e) => e.preventDefault() : undefined}
            >
              {r.label}
            </Link>
          ))}
        </div>
      ))}
    </div>
  );
}

function MobileNavItem({ item }: { item: NavItem }) {
  const [open, setOpen] = useState(false);
  const hasChildren = !!item.childs?.length;

  if (!hasChildren) {
    return (
      <li>
        <Link to={item.href} className="block py-2 text-sm font-lato">
          {item.label}
        </Link>
      </li>
    );
  }

  const isRegiones = item.label === "Regiones";

  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full text-left py-2 text-sm font-lato flex justify-between cursor-pointer"
      >
        {item.label} <span>{open ? "−" : "+"}</span>
      </button>
      {open &&
        (isRegiones ? (
          <div className="pl-4 pt-1 pb-2">
            <RegionSearchBox variant="mobile" browse={<MobileRegionBrowse item={item} />} />
          </div>
        ) : (
          <ul className="pl-4 space-y-1">
            <MobileSubsections item={item} />
          </ul>
        ))}
    </li>
  );
}

function MobileRegionBrowse({ item }: { item: NavItem }) {
  return (
    <ul className="space-y-1">
      <MobileSubsections item={item} />
    </ul>
  );
}

function MobileSubsections({ item }: { item: NavItem }) {
  return (
    <>
      {item.childs?.map((sub) => (
        <li key={sub.label} className="py-1">
          <p className="font-bold text-yellow-green/70 text-xs mb-1">{sub.label}</p>
          {sub.children?.map((r) => (
            <Link
              key={r.href}
              to={r.href === "#" ? "#" : r.href}
              className="block py-1 pl-2 text-xs hover:text-yellow-green"
            >
              {r.label}
            </Link>
          ))}
        </li>
      ))}
    </>
  );
}
