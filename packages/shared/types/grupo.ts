/** grupo.tsv + icon flag added during seeding */
export interface Grupo {
  parent: string;
  slug: string;
  label: string;
  descripcion: string | null;
  ref_id: string | null;
  tipo: string; // "biologico" | "interes"
  marino: string;
  icon: boolean;
}
