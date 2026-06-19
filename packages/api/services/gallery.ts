import { queryRows } from "../db.ts";

const GALLERY_REGIONS = [
  "colombia", "boyaca", "narino", "tolima", "santander", "region-amazonia",
];

/**
 * Port of make_gallery() from the legacy reference
 */
export async function getGallery(
  region: string
): Promise<Record<string, unknown>[]> {
  if (!GALLERY_REGIONS.includes(region)) return [];

  // Single-source from gallery_images (the SiB-edited Google Sheet
  // `imagenes_galeria` tab). The legacy GitLab-backed `dato_relevante`
  // table is stale and no longer the source of truth for destacados copy.
  const rows = await queryRows(
    `SELECT texto_destacado AS text, img_link AS image, credito AS credit
       FROM gallery_images WHERE slug_region = $1`,
    [region]
  );

  return rows.slice(0, 6).map((r) => ({
    text: r.text,
    image: r.image,
    credit: r.credit,
  }));
}
