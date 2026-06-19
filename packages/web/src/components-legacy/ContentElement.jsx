import classNames from 'classnames'
/* import { useEffect, useState } from 'react' */

import { Treemap, ResponsiveContainer, Tooltip as TooltipTreemap } from 'recharts'

import { Tooltip } from '@mui/material'
import { calculateWidth, explorerLink, formatNumbers } from './lib/functions'
import tooltips from '../data/tooltips.json'
import CardSimple from './CardSimple'
import { CardHead } from './CardGraph/CardHead'
import ConcentricCard from './ConcentricCard'
import ColorLabel from './ColorLabel'

const CustomTooltip = (props) => {
  const { active, payload } = props
  if (active && payload && payload.length) {
    const { name } = payload[0].payload
    return (
      <div className="bg-white p-1.5">
        <p className="text-dartmouth-green ">{`${name}: ${payload[0].value} especies`}</p>
      </div>
    )
  }

  return null
}

function ContentElement (props) {
  const { selected, info, slug } = props
  const contentTooltip = (value) => {
    return tooltips.filter((item) => item.slug === value)[0]?.tooltip
  }

  const data = info?.subgrupo_especies?.reduce((acc, { label_grupo: name, especies_region_total: especies }) => [...acc, { name, especies }], []) || []
  /* const [showTreeMap, setShowTreeMap] = useState(true) */

  // setShowTreeMap(dataInfo)
  /* const handleShow = () => {
    setShowTreeMap(prevState => !prevState)
  } */

  /* useEffect(() => {
    const dataInfo = data?.length !== 0 && data?.length >= 2
    setShowTreeMap(dataInfo)
    return () => {
    }
  }, [info]) */

  return (
    <>
      <div key={selected} className='bg-white py-10 min-h-[600px]'>
        <div className='w-11/12 gap-y-28 lg:w-11/12 flex flex-col lg:flex-row mx-auto justify-between'>
          <ConcentricCard {...props} />

          <div className='flex flex-col justify-center relative'>
            {data?.length !== 0 && data?.lenght !== 1 && <div className={classNames('pt-12 md:pt-0')}>
              <div className='h-72 w-72 lg:h-96 lg:w-10/12 max-w-4xl mx-auto pb-3 lg:pb-12'>
                <ResponsiveContainer >
                  <Treemap width={400} height={200} data={data} dataKey="especies" ratio={4 / 3} sx={{ stroke: '#fff', fill: '#8884d8' }} >
                    <TooltipTreemap content={<CustomTooltip />} />
                  </Treemap>
                </ResponsiveContainer>
              </div>
              {/* <div className={classNames('p-6 border-t border-t-dartmouth-green grid lg:grid-cols-3 pt-4 gap-2 ')}>
                <CardSimple title={'Especies amenazadas nacional'} especies={info?.especies_amenazadas_nacional_total} />
                <CardSimple title={'Especies amenazadas global'} especies={info?.especies_amenazadas_global_total} />
                <CardSimple title={'Especies CITES'} especies={info?.especies_cites_total} />
                <CardSimple title={'Especies migratorias'} especies={info?.especies_migratorias} />
                <CardSimple title={'Especies endemicas'} especies={info?.especies_endemicas} />
                <CardSimple title={'Especies exóticas'} especies={info?.especies_exoticas_total} />
              </div> */}
            </div>}

            <div className={classNames('grid grid-cols-1 lg:grid-cols-3 gap-3 border-t border-t-dartmouth-green pt-2')}>

              {/* nacional */}
              <div className='space-y-2 shadow-md flex flex-col py-6 px-4'>
                <CardHead
                  title={'Especies amenazadas nacional'}
                  especies={info?.especies_amenazadas_nacional_total}
                  registros={info?.registros_amenazadas_nacional_total}
                  datatable={info?.species_list_tematica['amenazadas-nacional']}
                  link={explorerLink(slug, "amenazadas-nacional", info?.slug)}
                />
                <div className='flex flex-col justify-center h-full'>
                  <div className='font-lato flex justify-evenly gap-x-4'>
                    <div className='flex flex-col items-center'>
                      <div className='flex items-start'>
                        <ColorLabel backgroundColor={'bg-red-cr'} label={'CR'} />
                        <Tooltip title={<b>{contentTooltip('amenazadas-nacional-cr')}</b>}>
                          <img src='/images/icon-more.svg' />
                        </Tooltip>

                      </div>
                      <span>{formatNumbers(info?.especies_amenazadas_nacional_cr)}</span>
                    </div>
                    <div className='flex flex-col items-center'>
                      <div className='flex items-start'>
                        <ColorLabel backgroundColor={'bg-orange-en'} label={'EN'} />
                        <Tooltip title={<b>{contentTooltip('amenazadas-nacional-en')}</b>}>
                          <img src='/images/icon-more.svg' />
                        </Tooltip>
                      </div>
                      <span>{formatNumbers(info?.especies_amenazadas_nacional_en)}</span>
                    </div>
                    <div className='flex flex-col items-center'>
                      <div className='flex items-start'>
                        <ColorLabel backgroundColor={'bg-yellow-vu'} label={'VU'} />
                        <Tooltip title={<b>{contentTooltip('amenazadas-nacional-vu')}</b>}>
                          <img src='/images/icon-more.svg' />
                        </Tooltip>
                      </div>
                      <span>{formatNumbers(info?.especies_amenazadas_nacional_vu)}</span>
                    </div>
                  </div>

                  <div className='flex w-full'>
                    <div className='bg-red-cr h-4' style={{ width: calculateWidth(+info?.especies_amenazadas_nacional_cr, (+info?.especies_amenazadas_nacional_cr + +info?.especies_amenazadas_nacional_en + +info?.especies_amenazadas_nacional_vu)) }}></div>
                    <div className='bg-orange-en h-4' style={{ width: calculateWidth(+info?.especies_amenazadas_nacional_en, (+info?.especies_amenazadas_nacional_cr + +info?.especies_amenazadas_nacional_en + +info?.especies_amenazadas_nacional_vu)) }}></div>
                    <div className='bg-yellow-vu h-4' style={{ width: calculateWidth(+info?.especies_amenazadas_nacional_vu, (+info?.especies_amenazadas_nacional_cr + +info?.especies_amenazadas_nacional_en + +info?.especies_amenazadas_nacional_vu)) }}></div>
                  </div>
                </div>
              </div>

              {/* global */}
              <div className='space-y-2 shadow-md flex flex-col py-6 px-4'>
                <CardHead
                  title={'Especies amenazadas global'}
                  especies={info?.especies_amenazadas_global_total}
                  registros={info?.registros_amenazadas_global_total}
                  datatable={info?.species_list_tematica['amenazadas-global']}
                  link={explorerLink(slug, "amenazadas-global", info?.slug)}

                />

                <div className='flex flex-col justify-center h-full'>
                  <div className='font-lato flex justify-evenly gap-x-4'>
                    <div className='flex flex-col items-center'>
                      <div className='flex items-start'>
                        <ColorLabel backgroundColor={'bg-red-cr'} label={'CR'} />
                        <Tooltip title={<b>{contentTooltip('amenazadas-global-cr')}</b>}>
                          <img src='/images/icon-more.svg' />
                        </Tooltip>
                      </div>
                      <span>{formatNumbers(info?.especies_amenazadas_global_cr)}</span>
                    </div>
                    <div className='flex flex-col items-center'>
                      <div className='flex items-start'>
                        <ColorLabel backgroundColor={'bg-orange-en'} label={'EN'} />
                        <Tooltip title={<b>{contentTooltip('amenazadas-global-en')}</b>}>
                          <img src='/images/icon-more.svg' />
                        </Tooltip>
                      </div>
                      <span>{formatNumbers(info?.especies_amenazadas_global_en)}</span>
                    </div>
                    <div className='flex flex-col items-center'>
                      <div className='flex items-start'>
                        <ColorLabel backgroundColor={'bg-yellow-vu'} label={'VU'} />
                        <Tooltip title={<b>{contentTooltip('amenazadas-global-vu')}</b>}>
                          <img src='/images/icon-more.svg' />
                        </Tooltip>
                      </div>
                      <span>{formatNumbers(info?.especies_amenazadas_global_vu)}</span>
                    </div>
                  </div>
                  <div className='flex w-full'>
                    <div className='bg-red-cr h-4' style={{ width: calculateWidth(+info?.especies_amenazadas_global_cr, (+info?.especies_amenazadas_global_cr + +info?.especies_amenazadas_global_en + +info?.especies_amenazadas_global_vu)) }}></div>
                    <div className='bg-orange-en h-4' style={{ width: calculateWidth(+info?.especies_amenazadas_global_en, (+info?.especies_amenazadas_global_cr + +info?.especies_amenazadas_global_en + +info?.especies_amenazadas_global_vu)) }}></div>
                    <div className='bg-yellow-vu h-4' style={{ width: calculateWidth(+info?.especies_amenazadas_global_vu, (+info?.especies_amenazadas_global_cr + +info?.especies_amenazadas_global_en + +info?.especies_amenazadas_global_vu)) }}></div>
                  </div>
                </div>
              </div>

              {/* cites */}
              <div className='space-y-2 shadow-md flex flex-col py-6 px-4'>
                <CardHead
                  title={'Especies CITES'}
                  especies={info?.especies_cites_total}
                  registros={info?.registros_cites_total}
                  datatable={info?.species_list_tematica?.cites}
                  link={explorerLink(slug, "cites", info?.slug)}
                />

                <div className='flex flex-col justify-end h-full'>
                  <div className='font-lato flex justify-evenly gap-x-4'>
                    <div className='flex flex-col items-center'>
                      <div className='flex items-start'>
                        <ColorLabel backgroundColor={'bg-cerulean'} label={'I'} />
                      </div>
                      <span>{formatNumbers(info?.especies_cites_i)}</span>
                    </div>
                    <div className='flex flex-col items-center'>
                      <div className='flex items-start'>
                        <ColorLabel backgroundColor={'bg-sandstorm'} label={'II'} />
                      </div>
                      <span>{formatNumbers(info?.especies_cites_ii)}</span>
                    </div>
                    <div className='flex flex-col items-center'>
                      <div className='flex items-start'>
                        <ColorLabel backgroundColor={'bg-greenish-cyan'} label={'III'} />
                      </div>
                      <span>{formatNumbers(info?.especies_cites_iii)}</span>
                    </div>
                  </div>
                  <div className='flex'>
                    <div className='bg-cerulean h-4' style={{ width: calculateWidth(+info?.especies_cites_i, (+info?.especies_cites_i + +info?.especies_cites_ii + +info?.especies_cites_iii)) }}></div>
                    <div className='bg-sandstorm h-4' style={{ width: calculateWidth(+info?.especies_cites_ii, (+info?.especies_cites_i + +info?.especies_cites_ii + +info?.especies_cites_iii)) }}></div>
                    <div className='bg-greenish-cyan h-4' style={{ width: calculateWidth(+info?.especies_cites_iii, (+info?.especies_cites_i + +info?.especies_cites_ii + +info?.especies_cites_iii)) }}></div>
                  </div>
                </div>
              </div>

              {/* Migrarotias */}
              <CardSimple
                style={1}
                datatable={info?.species_list_tematica.migratorias}
                title='Especies migratorias'
                especies={info?.especies_migratorias}
                registros={info?.registros_migratorias}
                link={explorerLink(slug, "migratorias", info?.slug)}
              />

              {/* Endemicas */}
              <CardSimple
                style={1}
                datatable={info?.species_list_tematica.endemicas}
                title='Especies endémicas'
                especies={info?.especies_endemicas}
                registros={info?.registros_endemicas}
                link={explorerLink(slug, "endemicas", info?.slug)}
              />

              {/* Exoticas */}
              <CardSimple
                style={1}
                title='Especies exóticas'
                especies={info?.especies_exoticas_total}
                registros={info?.registros_exoticas_total}
                datatable={info?.species_list_tematica['exoticas-total']}
                link={explorerLink(slug, "exoticas-total", info?.slug)}
              />

            </div>
            {/* {data?.length !== 0 && data?.lenght !== 1 &&
              (<button onClick={handleShow} className={classNames('border-t border-t-dartmouth-green flex p-2 ', showTreeMap ? 'absolute right-0 md:right-28 lg:-right-6 translate-y-[335.5px] md:translate-y-[288.4px] lg:translate-y-[383.5px]  transition' : 'absolute right-20 lg:-right-10 transition')}>
                <img className={classNames(showTreeMap ? 'rotate-90 ' : 'rotate-[270deg] ', 'h-6 w-6')} src='/images/arrow-left-carousel.svg' />
              </button>)
            } */}
          </div>
        </div>
      </div>
    </>
  )
}

export default ContentElement
