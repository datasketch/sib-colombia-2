import { useExploradorStore } from "../store";
import { useTematicasTree } from "../api";
import type { AmenazadasCategoria, TematicaNode } from "../types";

const AMEN_CATS: { value: AmenazadasCategoria; label: string }[] = [
  { value: "_total", label: "Total amenazadas" },
  { value: "_en", label: "EN" },
  { value: "_cr", label: "CR" },
  { value: "_vu", label: "VU" },
];

/** Parents whose children become a `subtematica` rather than replacing tematica. */
const SUBTEMATICA_PARENTS: ReadonlySet<string> = new Set(["cites", "exoticas-total"]);

/**
 * Hover (or focus) on the ⓘ icon to reveal a rich popup with the
 * combined `tooltip` + `descripcion` text from the API. Replaces the
 * native title="" attribute (browser tooltip with a 500ms delay and
 * no formatting). Mirrors the inkjet-styled hover popup from
 * R/exp_inputs_tematica.R:316-343.
 */
function InfoIcon({ tooltip }: { tooltip?: string }) {
  if (!tooltip) return null;
  return (
    <span
      tabIndex={0}
      role="img"
      aria-label="Información"
      className={[
        "group/info relative inline-block ml-1 text-gray-500 cursor-help text-xs",
        "hover:text-[#09A274] focus:text-[#09A274] focus:outline-none",
      ].join(" ")}
    >
      ⓘ
      <span
        role="tooltip"
        className={[
          "pointer-events-none invisible opacity-0",
          "group-hover/info:visible group-hover/info:opacity-100",
          "group-focus/info:visible group-focus/info:opacity-100",
          "transition-opacity duration-150",
          "absolute left-full top-1/2 -translate-y-1/2 ml-2 z-30",
          "w-80 max-w-[20rem] whitespace-pre-line",
          "bg-gray-50 text-gray-700 text-[13px] font-normal leading-relaxed",
          "border border-gray-200 rounded-md shadow-lg px-3 py-2",
        ].join(" ")}
      >
        {tooltip}
      </span>
    </span>
  );
}

function fullTooltip(node: TematicaNode): string | undefined {
  const parts = [node.tooltip, node.descripcion].filter(Boolean) as string[];
  return parts.length > 0 ? parts.join("\n\n") : undefined;
}

/**
 * A top-level parent (checkbox styled as radio) with its children (radio
 * group). Port of the render block in R/exp_inputs_tematica.R:710-810.
 */
function ParentBlock({ node }: { node: TematicaNode }) {
  const tematica = useExploradorStore((s) => s.tematica);
  const subtematica = useExploradorStore((s) => s.subtematica);
  const amenazadasCategoria = useExploradorStore((s) => s.amenazadasCategoria);
  const setTematica = useExploradorStore((s) => s.setTematica);
  const setSubtematica = useExploradorStore((s) => s.setSubtematica);
  const setAmenazadasCategoria = useExploradorStore((s) => s.setAmenazadasCategoria);
  const clearTematica = useExploradorStore((s) => s.clearTematica);

  const parentSlug = node.slug;
  const isAmenazadas = parentSlug === "amenazadas";
  const isSub = SUBTEMATICA_PARENTS.has(parentSlug);

  // Is this parent "active"?
  //   - amenazadas    → any of its children is current tematica
  //   - other subtem  → tematica === parent (with possible subtematica)
  //   - leaf parent   → tematica === parent
  const childSlugs = new Set((node.children ?? []).map((c) => c.slug));
  const active = isAmenazadas
    ? !!tematica && childSlugs.has(tematica)
    : tematica === parentSlug;

  const onParentCheck = (checked: boolean) => {
    if (!checked) {
      clearTematica();
      return;
    }
    if (isAmenazadas) {
      // Default: amenazadas-global + _total.
      setTematica("amenazadas-global", null);
      return;
    }
    setTematica(parentSlug, null);
  };

  // Child selection handler — behavior depends on the parent.
  const onChildSelect = (childSlug: string) => {
    if (isAmenazadas) {
      // child is amenazadas-global | amenazadas-nacional — replaces tematica,
      // category stays _total unless user changes it.
      setTematica(childSlug, null);
      return;
    }
    if (isSub) {
      // Parent stays as tematica; child becomes subtematica.
      setSubtematica(childSlug === "todas" ? null : childSlug);
      return;
    }
    // Default: child slug becomes the tematica.
    if (childSlug === "todas") {
      setTematica(parentSlug, null);
    } else {
      setTematica(childSlug, null);
    }
  };

  // Determine selected child radio value.
  let selectedChild: string | null = null;
  if (active) {
    if (isAmenazadas) {
      selectedChild = tematica;
    } else if (isSub) {
      selectedChild = subtematica ?? "todas";
    } else {
      // "todas" when tematica === parent and no nested selection; otherwise
      // tematica === child.
      selectedChild = tematica === parentSlug ? "todas" : tematica;
    }
  }

  return (
    <div className="mb-2">
      <label className="inline-flex items-center gap-2 cursor-pointer font-normal">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => onParentCheck(e.target.checked)}
          className="accent-[#09A274]"
        />
        <span>{node.label}</span>
        <InfoIcon tooltip={fullTooltip(node)} />
      </label>

      {active && node.children && node.children.length > 0 && (
        <div className="ml-6 mt-1 space-y-1">
          {/* "Todas" option — except for amenazadas. */}
          {!isAmenazadas && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={`tematica-children-${parentSlug}`}
                checked={selectedChild === "todas"}
                onChange={() => onChildSelect("todas")}
                className="accent-[#09A274]"
              />
              <span>Todas</span>
            </label>
          )}
          {node.children.map((c) => (
            <label key={c.slug} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={`tematica-children-${parentSlug}`}
                checked={selectedChild === c.slug}
                onChange={() => onChildSelect(c.slug)}
                className="accent-[#09A274]"
              />
              <span>{c.label}</span>
              <InfoIcon tooltip={fullTooltip(c)} />
            </label>
          ))}

          {/* Amenazadas category radios (_total / EN / CR / VU). */}
          {isAmenazadas && (
            <div className="ml-6 mt-1 space-y-1">
              {AMEN_CATS.map((cat) => (
                <label key={cat.value} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="amenazadas-categoria"
                    checked={amenazadasCategoria === cat.value}
                    onChange={() => setAmenazadasCategoria(cat.value)}
                    className="accent-[#09A274]"
                  />
                  <span>{cat.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function TematicaPanel() {
  const clear = useExploradorStore((s) => s.clearTematica);
  const { data, isLoading, error } = useTematicasTree();

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h5 className="font-medium">Temática</h5>
        <button
          type="button"
          onClick={clear}
          aria-label="Limpiar selección de temática"
          title="Limpiar selección"
          className={[
            "inline-flex items-center gap-1 text-xs",
            "border border-[#09A274] text-[#09A274] rounded px-2 py-1",
            "hover:bg-[#09A274] hover:text-white transition-colors",
          ].join(" ")}
        >
          <span aria-hidden>↻</span>
          <span>Limpiar</span>
        </button>
      </div>
      {isLoading && (
        <div className="space-y-2 animate-pulse" aria-hidden>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 bg-gray-100 rounded w-3/4" />
          ))}
        </div>
      )}
      {error && (
        <div className="border border-red-200 bg-red-50 text-red-800 p-2 rounded text-xs">
          <div className="font-semibold">Error al cargar temáticas</div>
          <div className="font-mono break-all">
            {(error as Error).message}
          </div>
        </div>
      )}
      {(data ?? []).map((node) => (
        <ParentBlock key={node.slug} node={node} />
      ))}
    </div>
  );
}
