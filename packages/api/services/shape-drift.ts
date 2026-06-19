import { queryRows } from "../db.ts";

export interface SlugDrift {
  slug: string;
  ok: boolean;
  diffCount: number;
  error?: string;
}

export interface ShapeReport {
  ok: boolean;
  contracts: number;
  passed: number;
  failed: number;
  totalDiffs: number;
  runAt: string;
  results: SlugDrift[];
}

/**
 * Returns the shape-validation report persisted by the seeder (stashed
 * in _sibdata_meta.shape_report as JSON). Null if the row is missing.
 */
export async function getPersistedShapeReport(): Promise<ShapeReport | null> {
  try {
    const rows = await queryRows(
      `SELECT value FROM _sibdata_meta WHERE key = 'shape_report'`,
    );
    const raw = rows[0]?.value;
    if (!raw) return null;
    return JSON.parse(String(raw)) as ShapeReport;
  } catch {
    return null;
  }
}

/**
 * Returns the drift entry for a specific slug, or null if the slug is
 * either absent from the report or passing.
 */
export async function getSlugDrift(slug: string): Promise<SlugDrift | null> {
  const report = await getPersistedShapeReport();
  if (!report) return null;
  const entry = report.results.find((r) => r.slug === slug);
  if (!entry || entry.ok) return null;
  return entry;
}
