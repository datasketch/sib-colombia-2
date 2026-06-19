/** region.tsv: parent, slug, label, tipo, subtipo, descripcion, marino */
export interface Region {
  parent: string;
  slug: string;
  label: string;
  tipo: string;
  subtipo: string;
  descripcion: string | null;
  marino: string | null;
}

/** departamento.tsv: slug, label, cod_dane, marino, fecha_corte */
export interface Departamento {
  slug: string;
  label: string;
  cod_dane: string;
  marino: string;
  fecha_corte: string;
}

/** municipio.tsv: slug, label, cod_dane, marino, fecha_corte */
export interface Municipio {
  slug: string;
  label: string;
  cod_dane: string;
  marino: string;
  fecha_corte: string;
}
