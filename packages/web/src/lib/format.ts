/** Format a number in Colombian locale: 45.343 */
export function formatNumber(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return "0";
  return new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(n);
}

/** Returns 0 for "NA" / null / undefined values, the number otherwise */
export function validateDifNa(v: unknown): number {
  if (v == null || v === "NA") return 0;
  const n = typeof v === "number" ? v : Number(v);
  return isNaN(n) ? 0 : n;
}

/** Capitalize first letter, replace hyphens with spaces */
export function capitalize(text: string): string {
  if (!text) return "";
  const cleaned = text.replace(/-/g, " ");
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/** Calculate width as percentage string for proportional bars */
export function calculateWidth(value: number, total: number): string {
  if (!total) return "0%";
  return `${(value / total) * 100}%`;
}

