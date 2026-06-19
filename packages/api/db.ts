import { DuckDBInstance } from "@duckdb/node-api";
import type { DuckDBConnection } from "@duckdb/node-api";
import { dirname, fromFileUrl, join } from "https://deno.land/std@0.224.0/path/mod.ts";

const __dirname = dirname(fromFileUrl(import.meta.url));
const DEFAULT_DB_PATH = join(__dirname, "..", "..", "data", "sibdata.duckdb");

let instancePromise: Promise<DuckDBInstance> | null = null;

/**
 * Get the shared DuckDBInstance (singleton).
 * Connections are created per-request from this instance — DuckDB connections
 * are not safe for concurrent prepared statements.
 */
function getInstance(): Promise<DuckDBInstance> {
  if (!instancePromise) {
    instancePromise = (async () => {
      const dbPath = Deno.env.get("SIBDATA_DB_PATH") ?? DEFAULT_DB_PATH;
      // SIBDATA_DB_READONLY=1 lets a script (e.g. generate-static) attach to
      // a database that's also locked by a running server.
      const readOnly = Deno.env.get("SIBDATA_DB_READONLY") === "1";
      const opts: Record<string, string> = {
        // Cap DuckDB's own working memory below the Deno Deploy isolate's
        // 586 MiB ceiling so V8 + runtime have headroom — without this,
        // concurrent requests OOM the isolate (upstream #5 follow-up).
        memory_limit: "400MB",
        // Single-threaded execution. The host already runs queries in
        // parallel via Promise.all at the route layer; per-query
        // multithreading just multiplies memory pressure.
        threads: "1",
        // Cuts DuckDB's per-query buffer overhead. Safe for our hot
        // paths because every ORDER BY now carries an explicit
        // tiebreaker (see species-list.ts).
        preserve_insertion_order: "false",
      };
      if (readOnly) opts.access_mode = "read_only";
      const inst = await DuckDBInstance.create(dbPath, opts);
      console.log(
        `DuckDB instance opened: ${dbPath}${readOnly ? " (read-only)" : ""} ` +
          `[memory_limit=${opts.memory_limit}, threads=${opts.threads}]`,
      );
      return inst;
    })();
  }
  return instancePromise;
}

/**
 * Get a fresh DuckDB connection.
 * Cheap to create from an existing instance.
 */
export async function getConnection(): Promise<DuckDBConnection> {
  const instance = await getInstance();
  return await instance.connect();
}

/**
 * Convert DuckDB result values — handles BigInt, Decimal, and Timestamp objects.
 */
// deno-lint-ignore no-explicit-any
function convertValue(val: any): any {
  if (val === null || val === undefined) return null;
  if (typeof val === "bigint") return Number(val);
  // DuckDB decimal: { value, scale }
  if (typeof val === "object" && "value" in val && "scale" in val) {
    const v = typeof val.value === "bigint" ? Number(val.value) : val.value;
    return v / Math.pow(10, val.scale);
  }
  // DuckDB timestamp: { micros }
  if (typeof val === "object" && "micros" in val) {
    const micros = typeof val.micros === "bigint" ? Number(val.micros) : val.micros;
    return new Date(micros / 1000).toISOString();
  }
  // DuckDB DATE: { days: N } — days since 1970-01-01 UTC.
  if (typeof val === "object" && "days" in val) {
    const days = typeof val.days === "bigint" ? Number(val.days) : val.days;
    return new Date(days * 86400000).toISOString().slice(0, 10);
  }
  return val;
}

/**
 * Execute a query and return rows as array of objects.
 * Creates a fresh connection per call so prepared statements don't collide.
 */
export async function queryRows(
  sql: string,
  // deno-lint-ignore no-explicit-any
  params?: any[]
): Promise<Record<string, unknown>[]> {
  const conn = await getConnection();
  try {
    const result = params
      ? await conn.runAndReadAll(sql, params)
      : await conn.runAndReadAll(sql);
    const columns = result.columnNames();
    return result.getRows().map((row) => {
      const obj: Record<string, unknown> = {};
      columns.forEach((col, i) => {
        obj[col] = convertValue(row[i]);
      });
      return obj;
    });
  } finally {
    try {
      conn.closeSync();
    } catch {
      // best-effort
    }
  }
}

/**
 * Execute a query and return the first row, or null.
 */
export async function queryOne(
  sql: string,
  // deno-lint-ignore no-explicit-any
  params?: any[]
): Promise<Record<string, unknown> | null> {
  const rows = await queryRows(sql, params);
  return rows[0] ?? null;
}

/**
 * Execute a query and return a single scalar value.
 */
export async function queryScalar<T = unknown>(
  sql: string,
  // deno-lint-ignore no-explicit-any
  params?: any[]
): Promise<T> {
  const rows = await queryRows(sql, params);
  const firstRow = rows[0];
  if (!firstRow) return null as T;
  const firstKey = Object.keys(firstRow)[0];
  return firstRow[firstKey] as T;
}
