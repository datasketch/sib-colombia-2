import { join } from "https://deno.land/std@0.224.0/path/mod.ts";
import { ensureDir } from "https://deno.land/std@0.224.0/fs/mod.ts";

// Source repo — env-overridable so the deliverable can be pointed at a
// different (or mirrored) GitLab project without editing code. Defaults to
// the public SiB Colombia repo.
const GITLAB_PROJECT = Deno.env.get("SIBDATA_GITLAB_PROJECT") ??
  "https://gitlab.com/sib-colombia/cifras-biodiversidad";
const GITLAB_PROJECT_ID = Deno.env.get("SIBDATA_GITLAB_PROJECT_ID") ??
  "sib-colombia/cifras-biodiversidad";
const GITLAB_DATA_PATH = Deno.env.get("SIBDATA_GITLAB_DATA_PATH") ??
  "db-cifras-sib";

function buildGitlabUrl(ref: string): string {
  const encoded = encodeURIComponent(ref);
  return `${GITLAB_PROJECT}/-/archive/${encoded}/cifras-biodiversidad-${encoded}.zip?path=${GITLAB_DATA_PATH}`;
}

export interface CommitInfo {
  sha: string;
  committed_date: string;
  title: string;
}

/**
 * Resolve a ref (branch, tag, or SHA) to commit metadata via the GitLab API.
 * Returns null on failure so the seeder can still run offline (e.g. CI with
 * network restrictions) — the metadata table just won't get SHA/date columns.
 */
export async function getGitlabRefInfo(ref: string): Promise<CommitInfo | null> {
  const projectId = encodeURIComponent(GITLAB_PROJECT_ID);
  const apiUrl =
    `https://gitlab.com/api/v4/projects/${projectId}/repository/commits/${encodeURIComponent(ref)}`;
  try {
    const res = await fetch(apiUrl);
    if (!res.ok) return null;
    const commit = (await res.json()) as {
      id: string;
      committed_date: string;
      title: string;
    };
    return {
      sha: commit.id,
      committed_date: commit.committed_date,
      title: commit.title,
    };
  } catch {
    return null;
  }
}

/**
 * Resolve an ISO date (YYYY-MM-DD or full ISO 8601) to the SHA of the
 * most recent commit on `main` that touched the `db-cifras-sib/` path
 * at or before that date. Uses GitLab's public REST API.
 *
 * @param date ISO date string accepted by GitLab's `until` parameter.
 * @returns commit metadata (sha + committed_date + title).
 */
export async function resolveGitlabDateToCommit(
  date: string,
): Promise<CommitInfo> {
  const projectId = encodeURIComponent(GITLAB_PROJECT_ID);
  const params = new URLSearchParams({
    until: date,
    path: GITLAB_DATA_PATH,
    per_page: "1",
    ref_name: "main",
  });
  const apiUrl =
    `https://gitlab.com/api/v4/projects/${projectId}/repository/commits?${params}`;

  const res = await fetch(apiUrl);
  if (!res.ok) {
    throw new Error(
      `GitLab API lookup failed: ${res.status} ${res.statusText}. URL: ${apiUrl}`,
    );
  }
  const commits = (await res.json()) as Array<CommitInfo & { id: string }>;
  if (!Array.isArray(commits) || commits.length === 0) {
    throw new Error(
      `No commits under ${GITLAB_DATA_PATH}/ found at or before ${date}.`,
    );
  }
  const { id, committed_date, title } = commits[0];
  console.log(
    `Resolved ${date} → ${id.slice(0, 8)} (${committed_date}): ${title}`,
  );
  return { sha: id, committed_date, title };
}

/** @deprecated use resolveGitlabDateToCommit; kept for call-site compatibility. */
export async function resolveGitlabDateToSha(date: string): Promise<string> {
  return (await resolveGitlabDateToCommit(date)).sha;
}

/**
 * Download the GitLab ZIP and extract TSV files.
 * Port of DATASET.R lines 8-16.
 *
 * @param dataRawDir Directory to write the extracted TSVs into.
 * @param ref GitLab ref: branch, tag, or commit SHA. Defaults to "main".
 */
export async function downloadGitlabData(
  dataRawDir: string,
  ref: string = "main",
): Promise<string> {
  const downloadsDir = join(dataRawDir, "downloads");
  const destDir = join(dataRawDir, "db-cifras-sib");

  await ensureDir(downloadsDir);

  const zipPath = join(downloadsDir, "db-cifras-sib.zip");

  const url = buildGitlabUrl(ref);
  console.log(`Downloading GitLab data (ref: ${ref})...`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Download failed for ref "${ref}": ${response.status} ${response.statusText}. URL: ${url}`,
    );
  }

  const data = new Uint8Array(await response.arrayBuffer());
  await Deno.writeFile(zipPath, data);
  console.log(`Downloaded ${(data.byteLength / 1024 / 1024).toFixed(1)} MB`);

  // Extract ZIP
  console.log("Extracting ZIP...");
  const unzip = new Deno.Command("unzip", {
    args: ["-o", zipPath, "-d", downloadsDir],
    stdout: "piped",
    stderr: "piped",
  });
  const { code, stderr } = await unzip.output();
  if (code !== 0) {
    throw new Error(`Unzip failed: ${new TextDecoder().decode(stderr)}`);
  }

  // GitLab extracts to `cifras-biodiversidad-<ref>-db-cifras-sib/db-cifras-sib/`,
  // where <ref> is the literal ref (slash-replaced) — a full 40-char SHA is NOT
  // truncated. Locate the directory dynamically rather than reconstructing its
  // name, which is brittle across ref kinds (branch/tag/SHA).
  let extractedRoot: string | null = null;
  for await (const e of Deno.readDir(downloadsDir)) {
    if (
      e.isDirectory &&
      e.name.startsWith("cifras-biodiversidad-") &&
      e.name.endsWith(`-${GITLAB_DATA_PATH}`)
    ) {
      extractedRoot = join(downloadsDir, e.name, GITLAB_DATA_PATH);
      break;
    }
  }
  if (!extractedRoot) {
    throw new Error(
      `Could not locate the extracted ${GITLAB_DATA_PATH}/ directory under ${downloadsDir} ` +
        `(ref "${ref}"). The GitLab archive layout may have changed.`,
    );
  }
  const extractedDir = extractedRoot;

  // Copy to final location
  try {
    await Deno.remove(destDir, { recursive: true });
  } catch {
    // Doesn't exist yet
  }
  await ensureDir(destDir);

  for await (const entry of Deno.readDir(extractedDir)) {
    if (entry.isFile && entry.name.endsWith(".tsv")) {
      await Deno.copyFile(join(extractedDir, entry.name), join(destDir, entry.name));
    }
  }

  // Cleanup downloads
  await Deno.remove(downloadsDir, { recursive: true });

  console.log(`TSV files extracted to ${destDir}`);
  return destDir;
}
