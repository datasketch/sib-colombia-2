export const formatNumbers = (number) => {
  // Distinguish "no measurement" from a measured zero. The API returns null
  // for non-applicable fields (e.g. especies_migratorias on plant groups);
  // those render as "-". A measured zero keeps rendering as "0".
  if (number === null || number === undefined) { return '-' }
  if (Number.isNaN(+number)) { return '-' }
  return new Intl.NumberFormat('es-CO').format(number)
}
export const formatPercent = (number) => {
  // One-decimal Colombian-locale percentage: 38,9 %. Returns '' for
  // null/undefined/NaN so callers can skip rendering the suffix.
  if (number === null || number === undefined) { return '' }
  if (Number.isNaN(+number)) { return '' }
  const value = new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(number)
  return `${value} %`
}
export const removeAccents = (str, accent = ' ') => {
  return str.normalize('NFC').replace(' ', accent)
}
export const numberWithCommas = (number) => {
  return number.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ',')
}

export const clearText = (str) => {
  return (str.charAt(0).toUpperCase() + str.slice(1)).replace('-', ' ')
}
export const clearLink = (str) => {
  return str.replace('?' || '#', '/').split('/')[0]
}

export const range = (start, end) => {
  const length = end - start + 1
  return Array.from({ length }, (_, idx) => idx + start)
}

export const ordinalSuffixOf = (value) => {
  const j = value % 10
  const k = value % 100
  if (j === 1 && k !== 11) {
    return 'er'
  }
  if (j === 2 && k !== 12) {
    return 'do'
  }
  if (j === 3 && k !== 13) {
    return 'er'
  }
  if (j === 7 && k !== 17) {
    return 'mo'
  }
  return 'to'
}

export const calculateWidth = (el, sum) => {
  if (isNaN(el)) return
  const width = ((el / sum) * 100).toFixed(1)
  if (width !== 'NaN') {
    return width + '%'
  }
  return null
}

export const selectColorRanking = (position) => {
  switch (position) {
    case 1:
      return '#ff2c00'
    case 2:
      return '#ff540f'
    case 3:
      return '#ff6f1f'
    case 4:
      return '#ff852f'
    case 5:
      return '#ff9a40'
    case 6:
      return '#ffad52'
    case 7:
      return '#ffbe67'
    case 8:
      return '#ffcf80'
    case 9:
      return '#ffdf9f'
    case 10:
      return '#ffeec9'
    default:
      return '#515B6A'
  }
}

export const validateDifNa = (val) => {
  return typeof val === 'string' && val === 'NA' ? 0 : +val
}

export const capitalize = (str = '') => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export const DIC_REF = [
  {
    ref_id: '10',
    label: 'peces dulceacuícolas'
  },
  {
    ref_id: '13',
    label: 'mariposas'
  },
  {
    ref_id: '41',
    label: 'orquídeas'
  },
  {
    ref_id: '42',
    label: 'aves'
  },
  {
    ref_id: '51',
    label: 'plantas'
  },
  {
    ref_id: '52',
    label: 'anfibios'
  },
  {
    ref_id: '53',
    label: 'reptiles'
  },
  {
    ref_id: '58',
    label: 'murciélagos'
  },
  {
    ref_id: '54',
    label: 'palmas'
  },
  {
    ref_id: '55',
    label: 'mamíferos'
  }
]

/**
 * Build the explorer query string for a "Ver lista completa" or table
 * link. Takes the leaf tematica slug as it appears on the cifras pages
 * and translates it to the canonical
 * `tematica=<root>&subtematica=<leaf>&amenazadasCategoria=_cr` shape
 * that the React explorer expects (closes #129/#133).
 *
 * Pass `grupoSlug` to also filter by a biological/interes group — used
 * by ConcentricCard (Top species per group) and ContentElement (group +
 * tematica cross-cuts). The explorer auto-classifies the grupo against
 * the API catalog at hydration time, so the linker doesn't need to
 * know whether the slug is biologico or interes.
 *
 * The explorer's url-sync also normalizes legacy single-slug forms,
 * so passing a deep slug here still works — but emitting the canonical
 * shape keeps the URL self-describing for users who copy/share it.
 */
export const explorerLink = (slugRegion, tematicaSlug, grupoSlug) => {
  if (!slugRegion) return ''

  let qs = `region=${slugRegion}`
  if (tematicaSlug) {
    const amenLeaf = /^(amenazadas-(?:global|nacional))-(cr|en|vu)$/.exec(tematicaSlug)
    if (amenLeaf) {
      qs += `&tematica=${amenLeaf[1]}&subtematica=${tematicaSlug}&amenazadasCategoria=_${amenLeaf[2]}`
    } else if (tematicaSlug === 'amenazadas-global' || tematicaSlug === 'amenazadas-nacional') {
      // Pin _total so the parent radio + "Total amenazadas" land selected.
      qs += `&tematica=${tematicaSlug}&amenazadasCategoria=_total`
    } else if (/^cites-(i|ii|iii|i-ii)$/.test(tematicaSlug)) {
      qs += `&tematica=cites&subtematica=${tematicaSlug}`
    } else if (
      tematicaSlug === 'invasoras' ||
      tematicaSlug === 'trasplantadas' ||
      tematicaSlug === 'exoticas' ||
      tematicaSlug === 'exoticas-riesgo-invasion-total'
    ) {
      qs += `&tematica=exoticas-total&subtematica=${tematicaSlug}`
    } else {
      // Underscore form (e.g. amenazadas_nacional, exoticas_total) coming
      // out of ContentElement — explorer normalizes this, but keep the URL
      // canonical here.
      qs += `&tematica=${tematicaSlug.replace(/_/g, '-')}`
    }
  }
  if (grupoSlug) {
    // ConcentricCard does `info.slug.replace('-', '_')` (only first dash)
    // — undo that buggy normalization so multi-segment slugs like
    // `bromelias-labiadas-pasifloras` round-trip cleanly.
    qs += `&grupo=${grupoSlug.replace(/_/g, '-')}`
  }
  return qs
}
