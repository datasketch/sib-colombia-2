import { DEFAULT_INDICATORS } from "@sibdata/shared";
import { queryRegionTematica } from "./sibdata-queries.ts";

/**
 * Port of region_indicadores() from the legacy reference
 * Fetches the region's row from `region_tematica` and projects the
 * named indicator columns down to the output aliases defined in
 * `DEFAULT_INDICATORS[section]`.
 *
 * Reuses the dispatcher (`queryRegionTematica`) so there is
 * exactly one place in the codebase that reads from `region_tematica`.
 * The projection + alias mapping happens in memory, no dynamic SQL.
 */
export async function getRegionIndicators(
  region: string,
  section: string,
): Promise<Record<string, unknown>> {
  const indicatorMap = DEFAULT_INDICATORS[section];
  if (!indicatorMap) throw new Error(`Unknown indicator section: ${section}`);

  const [row] = await queryRegionTematica(region);
  if (!row) return {};

  const out: Record<string, unknown> = {};
  for (const [alias, col] of Object.entries(indicatorMap)) {
    out[alias] = col in row ? row[col] : null;
  }
  return out;
}
