import { useExploradorStore } from "../store";
import type { Tipo } from "../types";

export function TipoSelect() {
  const tipo = useExploradorStore((s) => s.tipo);
  const setTipo = useExploradorStore((s) => s.setTipo);
  return (
    <div className="min-w-[180px]">
      <label htmlFor="tipo-select" className="block text-sm font-medium mb-1">
        Tipo
      </label>
      <select
        id="tipo-select"
        value={tipo}
        onChange={(e) => setTipo(e.target.value as Tipo)}
        className="w-full border border-gray-300 rounded px-2 py-1.5 focus:border-[#09A274] focus:outline-none focus-visible:ring-2 focus-visible:ring-dartmouth-green"
      >
        <option value="registros">Observaciones</option>
        <option value="especies">Especies</option>
      </select>
    </div>
  );
}
