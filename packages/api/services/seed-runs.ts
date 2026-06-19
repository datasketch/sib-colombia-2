/**
 * In-memory ring buffer of seed run history.
 * Note: this resets on every server restart, since Deno Deploy is stateless.
 * For persistent history, write to a metadata table in DuckDB.
 */

export interface SeedRun {
  id: string;
  startedAt: string;
  finishedAt: string | null;
  status: "running" | "success" | "failed";
  durationMs: number | null;
  log: string[];
  error: string | null;
}

const runs = new Map<string, SeedRun>();
const MAX_RUNS = 20;

export function createSeedRun(): SeedRun {
  const id = `seed_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const run: SeedRun = {
    id,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    status: "running",
    durationMs: null,
    log: [],
    error: null,
  };
  runs.set(id, run);

  // Evict oldest if over capacity
  if (runs.size > MAX_RUNS) {
    const oldest = runs.keys().next().value;
    if (oldest) runs.delete(oldest);
  }
  return run;
}

export function appendLog(id: string, line: string) {
  const run = runs.get(id);
  if (run) run.log.push(line);
}

export function finishSeedRun(id: string, success: boolean, error?: string) {
  const run = runs.get(id);
  if (!run) return;
  run.finishedAt = new Date().toISOString();
  run.status = success ? "success" : "failed";
  run.durationMs = new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime();
  if (error) run.error = error;
}

export function getSeedRun(id: string): SeedRun | null {
  return runs.get(id) ?? null;
}

export function listSeedRuns(): SeedRun[] {
  return [...runs.values()].sort((a, b) =>
    b.startedAt.localeCompare(a.startedAt)
  );
}

export function getLatestSeedRun(): SeedRun | null {
  const list = listSeedRuns();
  return list[0] ?? null;
}
