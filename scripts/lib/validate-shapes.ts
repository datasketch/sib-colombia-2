/**
 * Shape validation against the canonical visual contract.
 *
 * The "visual contract" is a small set of R-generated static JSON files
 * (in packages/api/static/) that the React components are guaranteed to
 * render correctly. Whenever the DuckDB-backed API computes a region's
 * shape, it must match the contract structurally — same keys, same nested
 * shapes, same array vs object decisions — or a component somewhere will
 * crash or render an empty section.
 *
 * This module is the single source of truth for "does the API still
 * match?" It's used by:
 *
 *   - packages/api/region-shape.test.ts          (CI tests)
 *   - packages/api/routes/admin.ts               (live admin endpoint)
 *   - packages/db/mod.ts (--validate flag)       (post-seed gate)
 *   - scripts/compare-region.ts                  (single-slug CLI)
 *
 * The diff rules live in scripts/lib/region-diff.ts and are intentionally
 * lenient about absent values (null/undefined/"NA"/""/[] all treated as
 * "absent") because R uses NA where DuckDB returns null and the static
 * contract uses [] for missing optional fields. We only flag *structural*
 * differences: missing/extra objects, type mismatches, array length
 * mismatches.
 */
import { dirname, fromFileUrl, join } from "https://deno.land/std@0.224.0/path/mod.ts";
import { diffRegions, type DiffEntry } from "./region-diff.ts";

const __dirname = dirname(fromFileUrl(import.meta.url));
const STATIC_DIR = join(__dirname, "..", "..", "packages", "api", "static");

/**
 * The 7 R-generated contract slugs. These files in packages/api/static/
 * are golden fixtures committed to git and protected from overwrites by
 * scripts/generate-static.ts.
 */
export const CONTRACT_SLUGS = [
  "colombia",
  "boyaca",
  "amazonas",
  "bogota-dc",
  "magdalena",
  "tunja",
  "chiquinquira",
] as const;

export type ContractSlug = typeof CONTRACT_SLUGS[number];

/** A function that returns the API shape for a given slug. */
export type ShapeFetcher = (slug: string) => Promise<unknown>;

export interface SlugValidation {
  slug: string;
  ok: boolean;
  diffCount: number;
  diffs: DiffEntry[];
  error?: string;
}

export interface ValidationReport {
  ok: boolean;
  contracts: number;
  passed: number;
  failed: number;
  totalDiffs: number;
  results: SlugValidation[];
  runAt: string;
}

/** Loads a contract JSON file from packages/api/static/{slug}.json. */
export async function loadContract(slug: string): Promise<unknown> {
  const path = join(STATIC_DIR, `${slug}.json`);
  return JSON.parse(await Deno.readTextFile(path));
}

/**
 * Validates a single slug against its contract.
 *
 * @param slug    contract slug (must have a JSON file in packages/api/static/)
 * @param fetcher returns the DuckDB-computed shape for this slug
 * @param opts.maxDiffs cap the number of diffs returned (default: unlimited)
 */
export async function validateSlug(
  slug: string,
  fetcher: ShapeFetcher,
  opts: { maxDiffs?: number } = {},
): Promise<SlugValidation> {
  try {
    const [contract, dynamic] = await Promise.all([
      loadContract(slug),
      fetcher(slug),
    ]);
    const allDiffs = diffRegions(contract, dynamic);
    const diffs = opts.maxDiffs != null
      ? allDiffs.slice(0, opts.maxDiffs)
      : allDiffs;
    return {
      slug,
      ok: allDiffs.length === 0,
      diffCount: allDiffs.length,
      diffs,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      slug,
      ok: false,
      diffCount: -1,
      diffs: [],
      error: msg,
    };
  }
}

/**
 * Validates every contract slug (or a custom subset) and returns a
 * structured report. Used by the post-seed validation gate.
 */
export async function validateAllContracts(
  fetcher: ShapeFetcher,
  opts: { slugs?: readonly string[]; maxDiffsPerSlug?: number } = {},
): Promise<ValidationReport> {
  const slugs = opts.slugs ?? CONTRACT_SLUGS;
  const results: SlugValidation[] = [];
  for (const slug of slugs) {
    results.push(
      await validateSlug(slug, fetcher, { maxDiffs: opts.maxDiffsPerSlug }),
    );
  }
  const passed = results.filter((r) => r.ok).length;
  const failed = results.length - passed;
  const totalDiffs = results.reduce(
    (sum, r) => sum + Math.max(0, r.diffCount),
    0,
  );
  return {
    ok: failed === 0,
    contracts: results.length,
    passed,
    failed,
    totalDiffs,
    results,
    runAt: new Date().toISOString(),
  };
}

/**
 * Convenience: pretty-print a validation report. Used by the seed
 * script's --validate gate so the build log shows what failed.
 */
export function formatReport(report: ValidationReport): string {
  const lines: string[] = [];
  lines.push(
    `Shape validation: ${report.passed}/${report.contracts} passed` +
      (report.failed > 0 ? ` (${report.failed} failed)` : "") +
      `, ${report.totalDiffs} total diffs`,
  );
  for (const r of report.results) {
    if (r.ok) {
      lines.push(`  ok    ${r.slug}`);
    } else if (r.error) {
      lines.push(`  ERROR ${r.slug}: ${r.error}`);
    } else {
      lines.push(`  FAIL  ${r.slug}: ${r.diffCount} diffs`);
      for (const d of r.diffs.slice(0, 8)) {
        const detail = d.detail ? ` (${d.detail})` : "";
        lines.push(`        ${d.kind.padEnd(18)} ${d.path}${detail}`);
      }
      if (r.diffs.length > 8) {
        lines.push(`        ... and ${r.diffs.length - 8} more`);
      }
    }
  }
  return lines.join("\n");
}
