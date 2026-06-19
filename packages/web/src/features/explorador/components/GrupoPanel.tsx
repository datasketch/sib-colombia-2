import { useMemo } from "react";
import { useExploradorStore } from "../store";
import { useGrupos } from "../api";
import type { GrupoTipo } from "../types";
import { GrupoTreePicker, type TreeItem } from "./GrupoTreePicker";

/**
 * Radio-styled checkbox: at most one parent (Biológico / Interés) is
 * selected, and clicking the selected one again unchecks it — matching
 * the toggle behavior in R/exp_inputs_grupo.R:393-436. Initial state is
 * BOTH unchecked (the live R short-circuits if no URL params are set).
 */
function ParentToggle({
  value,
  label,
}: {
  value: GrupoTipo;
  label: string;
}) {
  const grupoTipo = useExploradorStore((s) => s.grupoTipo);
  const setGrupoTipo = useExploradorStore((s) => s.setGrupoTipo);
  const checked = grupoTipo === value;
  return (
    <label className="flex items-center gap-2 cursor-pointer font-normal">
      <input
        type="checkbox"
        checked={checked}
        onChange={() => setGrupoTipo(checked ? null : value)}
        className="accent-[#09A274]"
      />
      <span>{label}</span>
    </label>
  );
}

function GrupoSelect({ tipo }: { tipo: GrupoTipo }) {
  const grupo = useExploradorStore((s) => s.grupo);
  const setGrupo = useExploradorStore((s) => s.setGrupo);
  const { data, isLoading, isError, error } = useGrupos(tipo);

  // The API returns rows in depth-first tree order with `level` and
  // `parent` carried through. Filter out the "todos" sentinel so the
  // tree picker can hoist it as a dedicated rootOption above the tree.
  const items: TreeItem[] = useMemo(() => {
    return (data ?? [])
      .filter((g) => g.slug !== "todos")
      .map((g) => ({
        value: g.slug,
        label: g.label,
        parent: g.parent ?? null,
        level: g.level ?? 0,
      }));
  }, [data]);

  if (isError) {
    return (
      <div className="border border-red-200 bg-red-50 text-red-800 p-2 rounded text-xs">
        <div className="font-semibold">Error al cargar grupos</div>
        <div className="font-mono break-all">{error?.message ?? "desconocido"}</div>
      </div>
    );
  }

  return (
    <GrupoTreePicker
      ariaLabel="Seleccione un grupo"
      placeholder={isLoading ? "Cargando…" : "Buscar grupo..."}
      disabled={isLoading}
      items={items}
      value={grupo ?? "todos"}
      onChange={(v) => setGrupo(v)}
      emptyText="Sin grupos que coincidan"
      rootOption={{ value: "todos", label: "Todos" }}
    />
  );
}

export function GrupoPanel() {
  const grupoTipo = useExploradorStore((s) => s.grupoTipo);
  return (
    <div className="space-y-2">
      <h5 className="font-medium">Tipo de grupo</h5>
      <div className="space-y-1">
        <ParentToggle value="biologico" label="Biológico" />
        {grupoTipo === "biologico" && (
          <div className="ml-6 mt-1">
            <GrupoSelect tipo="biologico" />
          </div>
        )}
        <ParentToggle value="interes" label="Interés de Conservación" />
        {grupoTipo === "interes" && (
          <div className="ml-6 mt-1">
            <GrupoSelect tipo="interes" />
          </div>
        )}
      </div>
    </div>
  );
}
