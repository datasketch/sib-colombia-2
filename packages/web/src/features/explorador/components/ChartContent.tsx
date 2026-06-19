import { useExploradorStore } from "../store";
import { useExploradorRegions } from "../api";
import { isLeafRegionSlug } from "../lib/region-tree";
import { usesLocator } from "../lib/available-charts";
import { CardsView } from "./views/CardsView";
import { MapView } from "./views/MapView";
import { LocatorMap } from "./views/LocatorMap";
import { PieView } from "./views/PieView";
import { DonutView } from "./views/DonutView";
import { BarView } from "./views/BarView";
import { TreemapView } from "./views/TreemapView";

/**
 * Viz dispatcher. 450px matches the R app's
 * `leafletOutput(..., height = 450)` and `highchartOutput(..., height = 450)`.
 *
 * The "Mapa" slot renders a choropleth for regions with subregions and a
 * locator for leaf / special regions (see `usesLocator`).
 */
export function ChartContent() {
  const chartType = useExploradorStore((s) => s.chartType);
  const region = useExploradorStore((s) => s.region);
  const { data: regions } = useExploradorRegions();
  const locator = usesLocator(region, isLeafRegionSlug(regions ?? [], region));

  return (
    <div className="min-h-[450px]" style={{ height: 450 }}>
      {chartType === "cards" && <CardsView />}
      {chartType === "map" && (locator ? <LocatorMap /> : <MapView />)}
      {chartType === "pie" && <PieView />}
      {chartType === "donut" && <DonutView />}
      {chartType === "bar" && <BarView />}
      {chartType === "treemap" && <TreemapView />}
    </div>
  );
}
