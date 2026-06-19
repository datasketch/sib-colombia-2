import classNames from 'classnames'
import { calculateWidth, formatNumbers, capitalize } from './lib/functions'
import CustomTooltip from './CustomTooltip'
import Table from './Table'

const BarPercent = ({ cat = '', label, region, regionparent, title, datatable = [], especies, registros, parentEspecies, speciesEstimadasCol, bgColor, textColor, link, municipalityflag, colObservadas, especiesObservadas }) => {
  const parenLabel = region !== 'Colombia' ? regionparent || 'Colombia' : ''
  const text = label ? `observadas ${label} (${title})` : `${title} observadas`
  // The species bar must fill `especies` out of the SAME total shown at the
  // bar's end: parentEspecies (Especies observadas Colombia), or
  // especiesObservadas for the two reserve municipios that compare against
  // their own observed total. Municipios previously divided by `registros`
  // (observation records), so e.g. 1 of 66 rendered as ~33% instead of ~1.5%
  // — the width no longer matched the "1 … 66" labels (#22, municipios).
  const barTotal = ['La Planada', 'Pialapí Pueblo-Viejo'].includes(region)
    ? +especiesObservadas
    : +parentEspecies
  const widthBarSpecies = calculateWidth(+especies, barTotal)
  const widthBarParent = calculateWidth(barTotal - +especies, barTotal)
  // The three-segment estimated bar is a cumulative scale on a 0..estimadasCol
  // axis: [region observed] [+ rest of Colombia observed] [+ gap to estimated],
  // with each segment's END label = the cumulative figure (especies <
  // parentEspecies < speciesEstimadasCol). The middle segment is therefore the
  // INCREMENT parentEspecies - especies, not the full parentEspecies — otherwise
  // the widths sum to >100% (1 + especies/estimadasCol) and the bar overflows /
  // is clipped, so it no longer matches the figures (#37, temáticas estimadas
  // + endémicas/migratorias).
  const widthRegEspecies = calculateWidth(+especies, +speciesEstimadasCol)
  const widthColObservadas = calculateWidth(+parentEspecies - +especies, +speciesEstimadasCol)
  const widthColEstimadas = calculateWidth(+speciesEstimadasCol - +parentEspecies, +speciesEstimadasCol)

  const capitalizeRegion = capitalize(regionparent)

  return (
    <div>
      <div className='font-bold font-inter text-lg '>
        <div>
          <p>
            {formatNumbers(especies)} Especies {text}
            {datatable?.length !== 0 && <CustomTooltip placement='left' title={<Table tabledata={datatable} link={link} />}>
              <img className='inline-block pl-0.5' src='/images/icons/icon-table.svg' />
            </CustomTooltip>}
          </p>
          {cat === 'amenazadas' && <p className='inline-flex -mt-3 text-black-3 text-sm'>
            {parentEspecies} Especies estimadas  {label} ({title}) {parenLabel}
          </p>}
        </div>
      </div>
      <div className='text-dartmouth-green font-inter'>
        {formatNumbers(registros)} <span className='font-lato'> Observaciones</span>
      </div>
      <div className=''>
        {
          region.toLowerCase() === 'colombia'
            ? (
              <p className='font-bold text-sm'>
                <span>Especies observadas CO |</span>{' '}
                <span className='text-black-3'>Especies estimadas CO ({parentEspecies})</span>
              </p>
              )
            : (
              <p className='font-bold text-sm'>
                <span>Especies observadas {region} |</span>{' '}
                {
                  municipalityflag && ['La Planada', 'Pialapí Pueblo-Viejo'].includes(region)
                    ? (
                      <span className="text-black-3">Especies totales observadas {capitalizeRegion} ({especiesObservadas})</span>
                      )
                    : (
                      <span className='text-black-3'>Especies observadas Colombia({parentEspecies}) | Especies estimadas Colombia({speciesEstimadasCol}) </span>
                      )
                }
              </p>
              )
        }
        {(region !== 'Colombia' && !municipalityflag)
          ? (<div className='flex'>
            <div
              className={classNames(bgColor, textColor, 'text-xs pl-px h-4 min-w-[3.5%]')}
              style={{ width: widthRegEspecies }}>{especies}</div>
            {<div
              className={classNames(bgColor, 'bg-opacity-30 text-end pr-1 text-xs  h-4')}
              style={{ width: widthColObservadas }}>{parentEspecies}</div>}
            <div
              className={classNames('bg-white-smoke text-end', 'text-xs pl-px h-4')}
              style={{ width: widthColEstimadas }}>{speciesEstimadasCol}</div>
          </div>)
          : (<div className='flex'>
            <div
              className={classNames(bgColor, textColor, widthBarSpecies === undefined ? '' : 'px-1 min-w-[3.5%]', 'text-xs h-4')} style={{ width: widthBarSpecies || '0%' }}>{especies}</div>
            {
              ['La Planada', 'Pialapí Pueblo-Viejo'].includes(region)
                ? <div
                  className={classNames('bg-white-smoke', 'text-xs pr-1 h-4 text-end')} style={{ width: widthBarParent || '100%' }}>
                  {especiesObservadas}
                </div>
                : <div
                  className={classNames('bg-white-smoke', 'text-xs pr-1 h-4 text-end')} style={{ width: widthBarParent || '100%' }}>
                  {/* {
                municipalityflag
                  ? (
                      registros === 'NA' ? '' : registros
                    )
                  : (parentEspecies === 'NA' ? '' : parentEspecies)
              } */}
                  {parentEspecies === 'NA' ? '' : parentEspecies}
                </div>
            }
          </div>)
        }
      </div>
    </div>
  )
}

export default BarPercent
