import { ExplorerLayout } from "./ExplorerLayout";
import { FilterPanel } from "./panels/FilterPanel";
import { VizPanel } from "./panels/VizPanel";
import { SpeciesPanel } from "./panels/SpeciesPanel";
import { MobileRotatePrompt } from "./components/MobileRotatePrompt";
import { useExploradorUrlSync } from "./url-sync";

/**
 * Mount point for the Explorador feature. Keeps URL ↔ store sync wired
 * in one place so every panel can read the store without caring about
 * router internals.
 */
export function Explorer() {
  useExploradorUrlSync();
  return (
    <>
      <MobileRotatePrompt />
      <ExplorerLayout
        filters={<FilterPanel />}
        viz={<VizPanel />}
        species={<SpeciesPanel />}
      />
    </>
  );
}
