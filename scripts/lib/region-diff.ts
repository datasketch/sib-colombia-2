/**
 * Structural diff logic shared between scripts/compare-region.ts (CLI) and
 * packages/api/region-shape.test.ts (CI). The rules:
 *
 *  - null, undefined, "NA", "" and [] are all treated as "absent" — R uses
 *    NA where DuckDB returns null, and the static contract uses [] where
 *    the dynamic shape may have null. None of those count as differences.
 *
 *  - Absent vs present is only flagged when the present side is structural
 *    (an object or non-empty array). Absent-vs-primitive is fine.
 *
 *  - Type mismatches and array length mismatches are always flagged.
 *
 *  - Primitive value mismatches are NOT flagged. Numbers can drift slightly
 *    as the upstream data refreshes, and short string labels also wobble.
 *
 * The goal isn't byte-for-byte equality — it's that the *shape* the React
 * components consume is the same.
 */

export type DiffKind =
  | "missing-in-api"
  | "extra-in-api"
  | "type-mismatch"
  | "length-diff";

export interface DiffEntry {
  path: string;
  kind: DiffKind;
  staticVal?: unknown;
  apiVal?: unknown;
  detail?: string;
}

function typeOf(v: unknown): string {
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  return typeof v;
}

/** Treat null, undefined, "NA", "" and [] as equivalent absences. */
export function isAbsent(v: unknown): boolean {
  if (v == null || v === "NA" || v === "") return true;
  if (Array.isArray(v) && v.length === 0) return true;
  return false;
}

function compareInto(
  staticVal: unknown,
  apiVal: unknown,
  path: string,
  diffs: DiffEntry[],
  depth: number,
) {
  if (isAbsent(staticVal) && isAbsent(apiVal)) return;

  if (isAbsent(staticVal) !== isAbsent(apiVal)) {
    const present = isAbsent(staticVal) ? apiVal : staticVal;
    if (typeof present === "object" && present !== null) {
      diffs.push({
        path,
        kind: isAbsent(staticVal) ? "extra-in-api" : "missing-in-api",
        staticVal: isAbsent(staticVal) ? undefined : staticVal,
        apiVal: isAbsent(apiVal) ? undefined : apiVal,
      });
    }
    return;
  }

  const sType = typeOf(staticVal);
  const aType = typeOf(apiVal);

  if (sType !== aType) {
    diffs.push({
      path,
      kind: "type-mismatch",
      detail: `static=${sType} api=${aType}`,
      staticVal,
      apiVal,
    });
    return;
  }

  if (sType === "array") {
    const sArr = staticVal as unknown[];
    const aArr = apiVal as unknown[];
    if (sArr.length !== aArr.length) {
      diffs.push({
        path,
        kind: "length-diff",
        detail: `static=${sArr.length} api=${aArr.length}`,
      });
    }
    if (sArr.length > 0 && aArr.length > 0 && depth < 3) {
      compareInto(sArr[0], aArr[0], `${path}[0]`, diffs, depth + 1);
    }
    return;
  }

  if (sType === "object") {
    const sObj = staticVal as Record<string, unknown>;
    const aObj = apiVal as Record<string, unknown>;
    const allKeys = new Set([...Object.keys(sObj), ...Object.keys(aObj)]);
    for (const key of allKeys) {
      compareInto(
        sObj[key],
        aObj[key],
        path ? `${path}.${key}` : key,
        diffs,
        depth,
      );
    }
    return;
  }

  // Primitives — never flagged.
}

/** Returns the structural differences between two region JSON shapes. */
export function diffRegions(
  staticVal: unknown,
  apiVal: unknown,
): DiffEntry[] {
  const diffs: DiffEntry[] = [];
  compareInto(staticVal, apiVal, "", diffs, 0);
  return diffs;
}
