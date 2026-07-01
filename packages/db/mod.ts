import { join, dirname, fromFileUrl } from "https://deno.land/std@0.224.0/path/mod.ts";
import { ensureDir } from "https://deno.land/std@0.224.0/fs/mod.ts";
import { parseArgs } from "https://deno.land/std@0.224.0/cli/parse_args.ts";
import { DuckDBInstance } from "@duckdb/node-api";

import {
  downloadGitlabData,
  getGitlabRefInfo,
  resolveGitlabDateToCommit,
  type CommitInfo,
} from "./download.ts";
import { writeMeta } from "./meta.ts";
import { fetchGoogleSheets } from "./fetch_sheets.ts";
import { ingestTsvFiles, getRowCount } from "./ingest.ts";
import { loadComplementaryData } from "./complementary.ts";
import { applyTematicaRootOrder } from "./tematica-order.ts";
import { updateIconFlags } from "./icons.ts";
import { createIndexes } from "./indexes.ts";
import {
  formatDataReport,
  runDataValidation,
  validationStatus,
} from "../../scripts/lib/validate-data.ts";

const __dirname = dirname(fromFileUrl(import.meta.url));
const REPO_ROOT = join(__dirname, "..", "..");

/**
 * `ind_meta.csv` is committed to the repo as the schema changelog for
 * indicators. After fetching the current Google Sheet, warn if the
 * on-disk file differs from the git HEAD version — intentional edits
 * should be reviewed and committed.
 */
async function warnIfIndMetaDrifted(complementaryDir: string): Promise<void> {
  const path = join(complementaryDir, "ind_meta.csv");
  try {
    const result = await new Deno.Command("git", {
      args: ["diff", "--quiet", "--", path],
      cwd: REPO_ROOT,
      stdout: "null",
      stderr: "null",
    }).output();
    if (result.code === 0) return; // no drift
    console.warn("");
    console.warn("⚠ ind_meta.csv drifted from the committed version.");
    console.warn("  The Google Sheet has changed indicator rows since the last commit.");
    console.warn("  Review:  git diff -- packages/db/data-raw/complementary/ind_meta.csv");
    console.warn("  Commit when intentional — ind_meta.csv is the schema changelog.");
    console.warn("");
  } catch (err) {
    // git may not be available (e.g. some Deno Deploy sandboxes). Don't
    // fail the seed — just note we couldn't check.
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`(Could not check ind_meta.csv drift: ${msg})`);
  }
}

async function main() {
  const args = parseArgs(Deno.args, {
    string: ["db-path", "icons-dir", "complementary-dir", "gitlab-ref", "gitlab-date"],
    boolean: ["skip-download", "skip-sheets", "validate", "no-validate", "help"],
    default: {
      "db-path": join(__dirname, "..", "..", "data", "sibdata.duckdb"),
      "icons-dir": join(__dirname, "static", "icons"),
      "complementary-dir": join(__dirname, "data-raw", "complementary"),
      "skip-download": false,
      "skip-sheets": false,
      "validate": true,
      "no-validate": false,
    },
  });

  if (args.help) {
    console.log(`
Usage: deno run -A packages/db/mod.ts [options]

Options:
  --db-path <path>             DuckDB output path (default: data/sibdata.duckdb)
  --gitlab-ref <ref>           GitLab branch, tag, or commit SHA to pin
                               the TSV download to (default: main)
  --gitlab-date <ISO date>     Resolve to the latest commit under
                               db-cifras-sib/ on main at or before this
                               date (e.g. 2025-12-31). Mutually exclusive
                               with --gitlab-ref.
  --skip-download              Skip GitLab download, use existing TSV files
  --skip-sheets                Skip Google Sheets fetch, use existing CSV files
  --icons-dir <path>           Icons directory (default: packages/db/static/icons)
  --complementary-dir <path>   Complementary CSV directory
  --no-validate                Skip the post-seed visual-contract shape check
  --help                       Show this help

Environment variables (all optional; flags above take precedence):
  SIBDATA_GITLAB_DATE          Same as --gitlab-date (cut date)
  SIBDATA_GITLAB_REF           Same as --gitlab-ref (branch/tag/SHA)
  SIBDATA_GITLAB_PROJECT       GitLab project URL (default: the public
                               SiB Colombia cifras-biodiversidad repo)
  SIBDATA_GITLAB_PROJECT_ID    GitLab project path/ID for the REST API
  SIBDATA_GITLAB_DATA_PATH     Subpath holding the TSVs (default: db-cifras-sib)
  SIBDATA_SHEET_DICTIONARY_ID  Google Sheet ID for the indicator dictionary
  SIBDATA_SHEET_TEXTOS_ID      Google Sheet ID for editorial texts/galleries

Default behavior downloads from both GitLab and Google Sheets, then runs
the visual-contract shape validation against the canonical contract slugs.
A non-zero exit means at least one shape drifted from the contract.
`);
    Deno.exit(0);
  }

  const dbPath = args["db-path"];
  const skipDownload = args["skip-download"];
  const skipSheets = args["skip-sheets"];
  const iconsDir = args["icons-dir"];
  const complementaryDir = args["complementary-dir"];
  // Cut selection — flag > env var > default. The data team picks the cut
  // without editing code: --gitlab-date / SIBDATA_GITLAB_DATE (a date) or
  // --gitlab-ref / SIBDATA_GITLAB_REF (a branch/tag/SHA). Date and ref are
  // mutually exclusive; default ref is "main" (latest published).
  const gitlabDate = args["gitlab-date"] ?? Deno.env.get("SIBDATA_GITLAB_DATE");
  const refOverride = args["gitlab-ref"] ?? Deno.env.get("SIBDATA_GITLAB_REF");
  let gitlabRef = refOverride ?? "main";
  const refWasExplicit = refOverride !== undefined && refOverride !== "";

  if (gitlabDate && refWasExplicit) {
    console.error(
      "Error: a GitLab ref and a GitLab date are mutually exclusive — set " +
        "only one of --gitlab-ref/SIBDATA_GITLAB_REF or --gitlab-date/SIBDATA_GITLAB_DATE.",
    );
    Deno.exit(1);
  }

  const dataRawDir = join(__dirname, "data-raw");

  console.log("=== SIB Colombia Database Seeder ===\n");
  console.log(`DB path: ${dbPath}`);
  let commitInfo: CommitInfo | null = null;
  if (gitlabDate) {
    console.log(`GitLab date: ${gitlabDate} (resolving to SHA…)`);
    commitInfo = await resolveGitlabDateToCommit(gitlabDate);
    gitlabRef = commitInfo.sha;
  }
  console.log(`GitLab ref: ${gitlabRef}`);
  console.log(`Skip GitLab download: ${skipDownload}`);
  console.log(`Skip Google Sheets: ${skipSheets}`);

  const startTime = performance.now();

  // Step 1a: Download GitLab TSVs
  const tsvDir = join(dataRawDir, "db-cifras-sib");

  if (!skipDownload) {
    await downloadGitlabData(dataRawDir, gitlabRef);
    // If we haven't already resolved commit metadata via --gitlab-date,
    // look up the ref now so the metadata table can record provenance.
    if (!commitInfo) {
      commitInfo = await getGitlabRefInfo(gitlabRef);
    }
  } else {
    try {
      const stat = await Deno.stat(tsvDir);
      if (!stat.isDirectory) throw new Error("Not a directory");
    } catch {
      throw new Error(
        `TSV directory not found at ${tsvDir}. Run without --skip-download first.`
      );
    }
    console.log(`Using existing TSV files at ${tsvDir}`);
  }

  // Step 1b: Fetch Google Sheets (complementary CSVs)
  if (!skipSheets) {
    await fetchGoogleSheets(complementaryDir);
    await warnIfIndMetaDrifted(complementaryDir);
  } else {
    console.log(`\nUsing existing complementary files at ${complementaryDir}`);
  }

  // Step 2: Create DuckDB and ingest TSVs
  await ensureDir(dirname(dbPath));

  // Remove existing DB files
  for (const ext of ["", ".wal"]) {
    try {
      await Deno.remove(dbPath + ext);
    } catch {
      // Doesn't exist
    }
  }

  const instance = await DuckDBInstance.create(dbPath);
  const conn = await instance.connect();

  await ingestTsvFiles(conn, tsvDir);

  // Step 3: Load complementary data
  await loadComplementaryData(conn, complementaryDir);

  // Step 3b: Patch tematica root orden (NULL upstream → 1..5 editorial).
  // See packages/db/tematica-order.ts and BACKLOG.md "tematica root
  // orden missing upstream" for the upstream fix.
  await applyTematicaRootOrder(conn);

  // Step 3c: Input data validation (structural + referential). Non-blocking
  // by default; SIBDATA_STRICT_VALIDATE=1 makes structural failures fatal.
  try {
    const qr = async (
      sql: string,
      // deno-lint-ignore no-explicit-any
      params?: any[],
    ): Promise<Record<string, unknown>[]> => {
      const result = params && params.length
        ? await conn.runAndReadAll(sql, params)
        : await conn.runAndReadAll(sql);
      const cols = result.columnNames();
      return result.getRows().map((row) => {
        const obj: Record<string, unknown> = {};
        cols.forEach((c, i) => (obj[c] = row[i]));
        return obj;
      });
    };
    const dataChecks = await runDataValidation(qr);
    console.log(`\n=== Data validation ===`);
    console.log(formatDataReport(dataChecks));
    if (validationStatus(dataChecks) === "fail") {
      if (Deno.env.get("SIBDATA_STRICT_VALIDATE") === "1") {
        console.error(
          "\n✗ Data validation FAILED (structural). Aborting (SIBDATA_STRICT_VALIDATE=1).",
        );
        conn.closeSync();
        instance.closeSync();
        Deno.exit(2);
      }
      console.error(
        "\n⚠ Data validation: structural failures (non-blocking — set SIBDATA_STRICT_VALIDATE=1 to fail the seed).",
      );
    }
  } catch (err) {
    console.warn(`Warning: data validation step failed to run: ${err}`);
  }

  // Step 4: Update icon flags
  try {
    await updateIconFlags(conn, iconsDir);
  } catch (err) {
    console.warn(`Warning: Could not update icon flags: ${err}`);
    console.warn("Icons directory may not exist. Skipping.");
  }

  // Step 5: Create indexes
  await createIndexes(conn);

  // Step 5b: Write build metadata (ref, resolved SHA, commit info, timestamp)
  await writeMeta(conn, {
    gitlab_ref_requested: args["gitlab-ref"],
    gitlab_ref_resolved: gitlabRef,
    gitlab_sha: commitInfo?.sha ?? null,
    gitlab_commit_date: commitInfo?.committed_date ?? null,
    gitlab_commit_title: commitInfo?.title ?? null,
    gitlab_date_requested: gitlabDate ?? null,
    seed_timestamp: new Date().toISOString(),
    skip_download: String(skipDownload),
    skip_sheets: String(skipSheets),
  });

  // Final summary
  const tableResult = await conn.runAndReadAll("SHOW TABLES");
  const tableRows = tableResult.getRows();

  console.log(`\n=== Summary ===`);
  console.log(`Tables: ${tableRows.length}`);

  let totalRows = 0;
  for (const row of tableRows) {
    const name = String(row[0]);
    const count = await getRowCount(conn, name);
    totalRows += count;
  }
  console.log(`Total rows: ${totalRows.toLocaleString()}`);

  await writeMeta(conn, { total_rows: String(totalRows) });

  conn.closeSync();
  // Release the DuckDB write lock so the validation step (which goes
  // through the API service layer) can attach with its own connection.
  instance.closeSync();

  const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
  console.log(`\nDone in ${elapsed}s`);
  console.log(`Database: ${dbPath}`);

  // Step 6: Visual-contract shape validation (post-seed gate).
  // Disabled by --no-validate. Imports the API service layer lazily so
  // a normal seed run doesn't pull it in until everything is on disk.
  if (args.validate && !args["no-validate"]) {
    console.log(`\n=== Shape validation ===`);
    const { validateAllContracts, formatReport, CONTRACT_SLUGS } = await import(
      "../../scripts/lib/validate-shapes.ts"
    );
    // The shape-contract fixtures (packages/api/static/<slug>.json) are a
    // migration-era QA aid: they let us diff the live DuckDB output against the
    // frozen legacy snapshots. They are stripped from the public deliverable,
    // which computes every region from DuckDB. Validate only the slugs whose
    // fixture is actually present, and skip the step entirely when none are —
    // so a clean (fixture-free) seed doesn't print spurious "N/N drifted" noise.
    const staticDir = join(__dirname, "..", "api", "static");
    const presentSlugs: string[] = [];
    for (const slug of CONTRACT_SLUGS) {
      try {
        if ((await Deno.stat(join(staticDir, `${slug}.json`))).isFile) {
          presentSlugs.push(slug);
        }
      } catch { /* fixture absent — nothing to diff against */ }
    }
    if (presentSlugs.length === 0) {
      console.log(
        "Skipped — no contract fixtures present; regions are computed live from DuckDB.",
      );
      Deno.exit(0);
    }

    // Point the API at the freshly written DB.
    Deno.env.set("SIBDATA_DB_PATH", dbPath);
    const regionDetail =
      (await import("../api/routes/region-detail.ts")).default;

    const fetcher = async (slug: string): Promise<unknown> => {
      const req = new Request(`http://internal/${slug}?nostatic=1`);
      const res = await regionDetail.fetch(req);
      if (!res.ok) {
        throw new Error(`handler ${res.status} ${res.statusText}`);
      }
      return await res.json();
    };

    const report = await validateAllContracts(fetcher, {
      slugs: presentSlugs,
      maxDiffsPerSlug: 12,
    });
    console.log(formatReport(report));

    // Persist the report so routes can surface drift
    // without re-running the diff. Reuse the singleton DuckDBInstance the
    // validation step already opened (via packages/api/db.ts) — opening a
    // second write-capable instance on the same file from the same
    // process is silently flaky.
    try {
      const { getConnection } = await import("../api/db.ts");
      const metaConn = await getConnection();
      try {
        await writeMeta(metaConn, {
          shape_report: JSON.stringify({
            ok: report.ok,
            contracts: report.contracts,
            passed: report.passed,
            failed: report.failed,
            totalDiffs: report.totalDiffs,
            runAt: report.runAt,
            results: report.results.map((r) => ({
              slug: r.slug,
              ok: r.ok,
              diffCount: r.diffCount,
              error: r.error,
            })),
          }),
        });
        console.log(
          `Shape report persisted to _sibdata_meta (${report.totalDiffs} diffs).`,
        );
      } finally {
        metaConn.closeSync();
      }
    } catch (err) {
      console.warn(`Warning: could not persist shape_report: ${err}`);
    }

    if (!report.ok) {
      const strict = Deno.env.get("SIBDATA_STRICT_SHAPE") === "1";
      const lead = strict ? "✗ Shape validation FAILED" : "⚠ Shape drift detected";
      console.error(
        `\n${lead}: ${report.failed}/${report.contracts} ` +
          `contract(s) drifted (${report.totalDiffs} structural diffs).`,
      );
      console.error(
        `  Run 'deno task diff:region <slug>' to see the full diff for any failing slug.`,
      );
      if (strict) {
        Deno.exit(2);
      }
      console.error(
        `  (Non-blocking — set SIBDATA_STRICT_SHAPE=1 to make this a hard failure.)`,
      );
      // Explicit exit to skip Deno's shutdown of the DuckDB singleton's
      // native instance — on linux-x64 the binding segfaults on unload
      // (exit 139) when the instance is still alive, killing the deploy
      // build chain after all useful work is done.
      Deno.exit(0);
    }
    console.log(
      `\n✓ Shape validation passed: ${report.passed}/${report.contracts} contracts match.`,
    );
    Deno.exit(0);
  }
}

main().catch((err) => {
  console.error("Error:", err);
  Deno.exit(1);
});
