import { queryRows } from "../db.ts";

/**
 * Get publishers for a region with tipo breakdown.
 * Port of the publicadores section in scripts/01_colombia.R
 */
export async function getRegionPublishers(
  region: string
): Promise<Record<string, unknown>> {
  const publicadores = await queryRows(`
    SELECT rp.slug_publicador, rp.registros, rp.especies,
      p.label, p.pais_publicacion, p.tipo_organizacion, p.tipo_publicador,
      p.url_logo, p.url_socio
    FROM region_publicador rp
    LEFT JOIN publicador p ON rp.slug_publicador = p.slug
    WHERE rp.slug_region = $1
    ORDER BY rp.registros DESC
  `, [region]);

  // Tipo breakdown
  const tipoMap = new Map<string, { n: number; obs: number }>();
  for (const p of publicadores) {
    const tipo = (p.tipo_organizacion as string) || "No definido";
    const entry = tipoMap.get(tipo) ?? { n: 0, obs: 0 };
    entry.n++;
    entry.obs += (p.registros as number) ?? 0;
    tipoMap.set(tipo, entry);
  }

  const totalN = publicadores.length;
  const totalObs = [...tipoMap.values()].reduce((s, e) => s + e.obs, 0);

  const publicadoresTipo = [...tipoMap.entries()].map(([tipo, { n, obs }]) => ({
    tipo_organizacion: tipo,
    n_tipo: n,
    n_tipo_obs: obs,
    pct_tipo: totalN > 0 ? n / totalN : 0,
    pct_tipo_obs: totalObs > 0 ? obs / totalObs : 0,
  }));

  return {
    publicadores_tipo: publicadoresTipo,
    publicadores_list: publicadores,
  };
}

/**
 * Get sponsors for a region.
 *
 * `region_patrocinador.tsv` now keys La Planada under the canonical
 * `reserva-forestal-la-planada` (upstream #13 fixed by annattalia, 2026-05).
 * The previous `reserva-forestal → reserva-natural` query-time alias
 * (DQ-001) is therefore stale and actively re-breaks the section — the
 * aliased slug no longer exists in the table — so it has been removed.
 * Slugs are passed straight through. See ISSUES.md DQ-001 (resolved).
 */
export async function getRegionSponsors(
  region: string
): Promise<Record<string, unknown>[]> {
  return await queryRows(`
    SELECT rp.slug_region, rp.slug_patrocinador,
      p.imagen, p.titulo, p.url
    FROM region_patrocinador rp
    LEFT JOIN patrocinador p ON rp.slug_patrocinador = p.slug
    WHERE rp.slug_region = $1
  `, [region]);
}
