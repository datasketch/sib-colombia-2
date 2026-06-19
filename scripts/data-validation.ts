/**
 * deno task validate:data
 *
 * Run the data-validation suite (scripts/lib/validate-data.ts) against the
 * seeded DuckDB and write a timestamped markdown report to tmp/validation/.
 *
 * Validates a SNAPSHOT COPY of the DB: DuckDB blocks cross-process opens when
 * a dev server holds the file's write lock, so we copy it (a consistent
 * point-in-time read) and validate the copy. The report includes GitLab
 * provenance (commit SHA + date) read from the _sibdata_meta table.
 *
 * Usage:
 *   deno task validate:data
 *   deno run -A scripts/data-validation.ts --db-path=data/sibdata.duckdb
 *   deno run -A scripts/data-validation.ts --out-dir=tmp/reports
 *
 * Exit code: 2 if any structural check FAILs, else 0.
 */
import { parseArgs } from "https://deno.land/std@0.224.0/cli/parse_args.ts";
import { ensureDir } from "https://deno.land/std@0.224.0/fs/mod.ts";
import {
  dirname,
  fromFileUrl,
  join,
} from "https://deno.land/std@0.224.0/path/mod.ts";
import {
  formatDataReport,
  runDataValidation,
  validationStatus,
} from "./lib/validate-data.ts";

const __dirname = dirname(fromFileUrl(import.meta.url));
const REPO_ROOT = join(__dirname, "..");

async function main() {
  const args = parseArgs(Deno.args, { string: ["db-path", "out-dir"] });

  const srcPath = args["db-path"]
    ? join(REPO_ROOT, args["db-path"])
    : join(REPO_ROOT, "data", "sibdata.duckdb");
  const outDir = args["out-dir"]
    ? join(REPO_ROOT, args["out-dir"])
    : join(REPO_ROOT, "tmp", "validation");
  await ensureDir(outDir);

  // Snapshot the DB so we never fight a running server's write lock.
  const snapPath = join(outDir, `.snapshot-${Deno.pid}.duckdb`);
  await Deno.copyFile(srcPath, snapPath);
  try {
    await Deno.copyFile(`${srcPath}.wal`, `${snapPath}.wal`);
  } catch {
    // No WAL alongside the DB — nothing to copy.
  }
  Deno.env.set("SIBDATA_DB_PATH", snapPath);

  let status: "pass" | "warn" | "fail" = "pass";
  try {
    // Import after SIBDATA_DB_PATH is set — db.ts opens the instance lazily.
    const { queryRows } = await import("../packages/api/db.ts");

    const checks = await runDataValidation(queryRows);
    status = validationStatus(checks);

    // GitLab provenance from the seed metadata table.
    const meta = new Map<string, string>();
    try {
      const rows = await queryRows(`SELECT key, value FROM _sibdata_meta`);
      for (const r of rows) {
        meta.set(String(r.key), r.value == null ? "" : String(r.value));
      }
    } catch (err) {
      console.warn(`Could not read _sibdata_meta: ${err}`);
    }
    const sha = meta.get("gitlab_sha") ?? "";
    const shaShort = sha ? sha.slice(0, 8) : "nosha";

    const provenance = [
      "",
      "## Provenance",
      "",
      `- **GitLab ref:** ${meta.get("gitlab_ref_resolved") || "—"} (requested: ${meta.get("gitlab_ref_requested") || "—"})`,
      `- **GitLab commit:** \`${sha || "—"}\``,
      `- **Commit date:** ${meta.get("gitlab_commit_date") || "—"}`,
      `- **Commit title:** ${meta.get("gitlab_commit_title") || "—"}`,
      `- **Date requested (--gitlab-date):** ${meta.get("gitlab_date_requested") || "—"}`,
      `- **Seed timestamp:** ${meta.get("seed_timestamp") || "—"}`,
      `- **Total rows:** ${meta.get("total_rows") || "—"}`,
      `- **Source DB:** ${srcPath}`,
      `- **Report generated:** ${new Date().toISOString()}`,
    ].join("\n");

    const report = `${formatDataReport(checks)}\n${provenance}\n`;

    // Timestamped filename (UTC) + short SHA so the file says what it's about.
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const ts =
      `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}` +
      `-${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}`;
    const file = join(outDir, `data-validation-${ts}-${shaShort}.md`);
    await Deno.writeTextFile(file, report);

    console.log(report);
    console.log(`\nReport written to ${file}`);
    console.log(`Overall status: ${status.toUpperCase()}`);
  } finally {
    for (const p of [snapPath, `${snapPath}.wal`]) {
      try {
        await Deno.remove(p);
      } catch {
        // best-effort snapshot cleanup
      }
    }
  }

  if (status === "fail") Deno.exit(2);
}

main().catch((err) => {
  console.error("Error:", err);
  Deno.exit(1);
});
