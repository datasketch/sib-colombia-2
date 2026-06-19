/** tematica (custom version from data-raw/tematica.tsv) + icon flag */
export interface Tematica {
  parent: string;
  slug: string;
  label: string;
  orden: string | null;
  tooltip: string | null;
  descripcion: string | null;
  activa: string; // "TRUE" | "FALSE"
  icon: boolean;
}
