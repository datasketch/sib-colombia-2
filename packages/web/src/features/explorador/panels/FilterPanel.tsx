import { RegionSelect } from "../components/RegionSelect";
import { GrupoPanel } from "../components/GrupoPanel";
import { TematicaPanel } from "../components/TematicaPanel";

export function FilterPanel() {
  return (
    <div className="space-y-5">
      <h4 className="font-semibold text-base mb-0">Opciones</h4>
      <RegionSelect />
      <GrupoPanel />
      <TematicaPanel />
    </div>
  );
}
