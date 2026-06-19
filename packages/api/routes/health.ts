import { Hono } from "hono";
import { queryRows, queryScalar } from "../db.ts";
import { getPersistedShapeReport } from "../services/shape-drift.ts";

const health = new Hono();

/**
 * GET /api/health — production readiness probe for uptime monitors.
 *
 * Reports:
 *   - db state (can we reach the DuckDB file and read a core table?)
 *   - last seed timestamp + upstream provenance (_sibdata_meta)
 *   - shape-gate status (persisted shape_report: drift = failing contracts)
 *
 * Returns 200 when the DB is reachable, 503 otherwise. The shape gate is
 * reported but does NOT fail the probe on its own — a drift is a data
 * signal, not a process-down signal (a monitor can alert on `shape.ok`).
 */
health.get("/", async (c) => {
  // DB liveness: a trivial query against a core table. If the file is
  // missing/locked this throws and we report unhealthy.
  let dbOk = false;
  let regionCount: number | null = null;
  try {
    regionCount = Number(await queryScalar<number>(
      "SELECT count(*) FROM region",
    ));
    dbOk = regionCount > 0;
  } catch {
    dbOk = false;
  }

  // Seed provenance from _sibdata_meta (best-effort — never throws).
  const meta: Record<string, string> = {};
  try {
    const rows = await queryRows(
      `SELECT key, value FROM _sibdata_meta
        WHERE key IN ('seed_timestamp', 'gitlab_ref_resolved', 'gitlab_sha',
                      'gitlab_commit_date', 'gitlab_date_requested')`,
    );
    for (const r of rows) {
      if (r.value != null) meta[String(r.key)] = String(r.value);
    }
  } catch {
    // meta table absent — leave empty
  }

  // Shape gate (visual contract). Null if never run.
  const shapeReport = await getPersistedShapeReport();
  const shape = shapeReport
    ? {
      ok: shapeReport.ok,
      contracts: shapeReport.contracts,
      passed: shapeReport.passed,
      failed: shapeReport.failed,
      totalDiffs: shapeReport.totalDiffs,
      runAt: shapeReport.runAt,
    }
    : null;

  const body = {
    status: dbOk ? "ok" : "unhealthy",
    service: "sibdata-api",
    db: {
      ok: dbOk,
      regions: regionCount,
    },
    seed: {
      timestamp: meta.seed_timestamp ?? null,
      gitlabRef: meta.gitlab_ref_resolved ?? null,
      gitlabSha: meta.gitlab_sha ?? null,
      gitlabCommitDate: meta.gitlab_commit_date ?? null,
      gitlabDateRequested: meta.gitlab_date_requested ?? null,
    },
    shape,
  };

  return c.json(body, dbOk ? 200 : 503);
});

export default health;
