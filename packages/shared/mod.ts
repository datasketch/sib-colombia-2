// Types
export type { Region, Departamento, Municipio } from "./types/region.ts";
export type {
  Especie,
  EspecieRegion,
  EspecieGrupo,
  EspecieTematica,
  EspecieMeta,
} from "./types/especie.ts";
export type { Grupo } from "./types/grupo.ts";
export type { Tematica } from "./types/tematica.ts";
export type {
  RegionTematica,
  RegionGrupo,
  IndMeta,
} from "./types/indicators.ts";
export type { Publicador, RegionPublicador } from "./types/publicador.ts";
export type { TreeNode } from "./types/navigation.ts";
export type { Slide, SpeciesObservation } from "./types/slides.ts";
export type {
  RegionData,
  GeneralInfo,
  GalleryItem,
  TematicaSection,
  SpeciesListItem,
  GrupoData,
  HomeData,
  PublicadoresData,
} from "./types/api-responses.ts";

// Constants
export { DEFAULT_INDICATORS } from "./constants/indicators.ts";
export { expandTematica } from "./constants/tematica-expansion.ts";

// Utilities
export { formatNumber, formatDate } from "./utils/formatting.ts";
export { buildTree } from "./utils/tree-builder.ts";
export { interpolate } from "./utils/text-templates.ts";
