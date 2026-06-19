import { useMemo } from "react";
import { useExploradorStore } from "../store";
import { useExploradorRegions } from "../api";
import { buildRegionTree } from "../lib/region-tree";
import { RegionTreePicker } from "./RegionTreePicker";

export function RegionSelect() {
  const region = useExploradorStore((s) => s.region);
  const setRegion = useExploradorStore((s) => s.setRegion);
  const { data, isLoading, error } = useExploradorRegions();

  const tree = useMemo(() => buildRegionTree(data ?? []), [data]);

  return (
    <div>
      <label htmlFor="region-select" className="block text-sm font-medium mb-1">
        Seleccione Región
      </label>
      {error ? (
        <div className="border border-red-200 bg-red-50 text-red-800 p-2 rounded text-xs">
          <div className="font-semibold">Error al cargar regiones</div>
          <div className="font-mono break-all">{error.message}</div>
        </div>
      ) : (
        <RegionTreePicker
          id="region-select"
          ariaLabel="Seleccione una región"
          placeholder={isLoading ? "Cargando…" : "Seleccione una región..."}
          disabled={isLoading}
          data={tree}
          value={region}
          onChange={(v) => setRegion(v || null)}
        />
      )}
    </div>
  );
}
