/**
 * Format a number in Colombian locale: 45.343 (dot as thousands separator).
 * Port of makeup() from the R package and formatNumbers() from the Next.js site.
 */
export function formatNumber(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return "0";
  return new Intl.NumberFormat("es-CO", {
    maximumFractionDigits: 0,
  }).format(n);
}

/**
 * Format a date in Spanish: "diciembre 12 de 2030"
 */
export function formatDate(
  // deno-lint-ignore no-explicit-any
  date: Date | string | null | any,
  fallback = ""
): string {
  if (!date) return fallback;
  // Handle DuckDB Date objects (have days property) and Timestamp objects (have micros)
  let d: Date;
  if (date instanceof Date) {
    d = date;
  } else if (typeof date === "string") {
    d = new Date(date);
  } else if (typeof date === "object" && "days" in date) {
    // DuckDB Date: days since epoch
    d = new Date(Number(date.days) * 86400000);
  } else if (typeof date === "object" && "micros" in date) {
    // DuckDB Timestamp: microseconds since epoch
    d = new Date(Number(date.micros) / 1000);
  } else {
    d = new Date(String(date));
  }
  if (isNaN(d.getTime())) return fallback;

  const months = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
  ];
  return `${months[d.getMonth()]} ${d.getDate()} de ${d.getFullYear()}`;
}
