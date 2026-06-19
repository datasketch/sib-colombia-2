import { explorerLink, formatNumbers, formatPercent } from './lib/functions'
import Concentric from './Concentric'
import CustomTooltip from './CustomTooltip'
import Table from './Table'

const ConcentricCard = (props) => {
  const { slug, selected, info, region, observadasCol, municipalityflag, parentlabel } = props

  // Special regions (Resguardo, Reserva, Región Amazonía, NDFyB) compare the
  // selected group against its parent group in the SAME region (or the
  // region's total observed species for top-level / non-nested groups),
  // including the percentage it represents. The backend supplies `comparison`
  // only for those regions; everywhere else it is null and we keep the
  // same-group-vs-Colombia bullseye. See client spec 2026-06 (Anexo UX/UI).
  const comparison = info?.comparison

  if (comparison) {
    return (
      <div className='flex flex-col gap-4 space-y-3 lg:w-4/12 mx-auto py-8 px-3'>
        <div className='font-bold'>
          <div className='text-6xl font-inter font-black '>
            <span>{formatNumbers(info?.especies_region_total)}</span>
            <div className='border-b-2 border-dartmouth-green w-2/3 ' />
          </div>
          <div className='flex gap-x-2 ' >
            <div className='font-inter font-black text-lg'>
              Especies de {selected.toLowerCase()}
              <CustomTooltip title={<Table tabledata={info?.species_list_top} general link={explorerLink(slug, null, info?.slug)} />}>
                <img className='inline-block pl-2' src='/images/icons/icon-table.svg' />
              </CustomTooltip>
            </div>
          </div>
        </div>

        <div className='text-sm font-inter text-blue-green space-x-1 flex '>
          <p className='inline-block '><b>{formatNumbers(info?.registros_region_total)}</b></p>
          <p className='inline-block'>Observaciones</p>
        </div>

        <div className='relative pt-1.5'>
          <Concentric outer={comparison.ref_especies} inner={info?.especies_region_total} style='style-2' />

          <div className='absolute top-[200px] left-1/4 xl:left-[15%] flex flex-col'>
            <span className='font-black text-lg'>
              {formatNumbers(info?.especies_region_total)}
            </span>
            <span className='text-sm'> Especies de {selected.toLowerCase()} en {region}</span>
          </div>

          <div className='absolute -left-4 top-[260px] flex flex-col'>
            <span className='font-black text-lg'>
              {formatNumbers(comparison.ref_especies)}
              {comparison.percentage != null &&
                <span className='font-normal text-blue-green'> ({formatPercent(comparison.percentage)})</span>}
            </span>
            {comparison.ref_kind === 'grupo'
              ? (<span className='text-sm'> del total de {comparison.ref_label} en {region}</span>)
              : (<span className='text-sm'> del total de especies observadas en {region}</span>)
            }
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-4 space-y-3 lg:w-4/12 mx-auto py-8 px-3'>
      <div className='font-bold'>
        <div className='text-6xl font-inter font-black '>
          <span>{formatNumbers(info?.especies_region_total)}</span>
          <div className='border-b-2 border-dartmouth-green w-2/3 ' />
        </div>
        <div className='flex gap-x-2 ' >
          <div className='font-inter font-black text-lg'>
            Especies de {selected.toLowerCase()}
            <CustomTooltip title={<Table tabledata={info?.species_list_top} general link={explorerLink(slug, null, info?.slug)} />}>
              <img className='inline-block pl-2' src='/images/icons/icon-table.svg' />
            </CustomTooltip>
          </div>
        </div>
      </div>

      <div className='text-sm font-inter text-blue-green space-x-1 flex '>
        <p className='inline-block '><b>{formatNumbers(info?.registros_region_total)}</b></p>
        <p className='inline-block'>Observaciones</p>
      </div>

      <div className='relative pt-1.5'>
        <Concentric outer={info?.parent[0] ? info?.parent[0].especies_region_total : slug === 'colombia' ? observadasCol : info?.especies_region_total} inner={info?.especies_region_total} style='style-2' />

        <div className='absolute top-[200px] left-1/4 xl:left-[15%] flex flex-col'>
          <span className='font-black text-lg'>
            {formatNumbers(info?.especies_region_total)}
          </span>
          <span className='text-sm'> Especies de {selected.toLowerCase()} en {region}</span>
        </div>

        <div className='absolute -left-4 top-[260px] flex flex-col'>
          <span className='font-black text-lg'>
            {formatNumbers(info?.parent[0] ? info?.parent[0].especies_region_total : slug === 'colombia' ? observadasCol : info?.especies_region_total)}
          </span>
          {slug === 'colombia'
            ? (<span className='text-sm'> Especies observadas en Colombia</span>)
            : (<span className='text-sm'> Especies de {selected.toLowerCase()} en {municipalityflag ? parentlabel : 'Colombia'}</span>)
          }
        </div>
      </div>
    </div>
  )
}

export default ConcentricCard
