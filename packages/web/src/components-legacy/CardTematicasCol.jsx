/* eslint-disable no-unused-vars */

import { Tooltip } from '@mui/material'
import PropTypes from 'prop-types'
import { calculateWidth, capitalize, explorerLink, formatNumbers } from './lib/functions'
import tooltips from '../data/tooltips.json'
import { Abbr } from '../components/Abbr'
import CustomTooltip from './CustomTooltip'
import Table from './Table'
import ReactMarkdown from 'react-markdown'
import BarPercent from './BarPercent'
import CardContentTem from './CardContentTem'
import ColorLabel from './ColorLabel'

const CardTematicasCol = props => {
  const { info, slugregion, selected, updateBreadcrumb, region, municipalityflag } = props

  const contentTooltip = (value) => {
    return tooltips.filter((item) => item.slug === value)[0]?.tooltip
  }

  if (selected.toLowerCase() === 'amenazadas') {
    return (
      <div className='py-10 bg-white'>
        <div className='grid lg:grid-cols-2 gap-y-6 gap-x-36 w-10/12 mx-auto'>
          {info?.children.map(({ label, slug, especies, registros, species_list: speciesList, cr: crRegister, en: enRegister, vu: vuRegister }, key) => {
            const title = capitalize(slug.replace('amenazadas-', ''))
            return <div key={key} className='shadow-md flex flex-col justify-center gap-6 py-12 px-8'>
              <div className='flex flex-col items-start justify-start'>
                <span>Categoría {title === 'Global' ? <><Abbr sigla="UICN" /> Global</> : 'Nacional'}</span>
                <span className='text-6xl font-black font-inter'>
                  {formatNumbers(especies)}
                  <div className='border-t border-t-dartmouth-green' />
                </span>
                <div className='font-black font-inter text-lg'>Especies amenazadas
                  {speciesList?.length !== 0 && <CustomTooltip placement='left' title={<Table tabledata={speciesList} link={explorerLink(slugregion, slug)} />}>
                    <img className='inline-block pl-2' src='/images/icons/icon-table.svg' />
                  </CustomTooltip>}
                </div>
              </div>
              <div className='flex flex-col justify-center h-full w-full'>
                <div className='font-lato flex justify-evenly gap-x-4'>
                  <div className='flex flex-col items-center'>
                    <div className='flex items-start'>
                      <ColorLabel backgroundColor={'bg-red-cr'} label={'CR'} />
                      {/* <div className='flex flex-row gap-1 items-center'>
                        <div className='rounded-full bg-red-cr w-3 h-3' />
                        <b>CR</b>
                      </div> */}
                      <Tooltip title={<b>{contentTooltip('amenazadas-global-cr')}</b>}>
                        <img src='/images/icon-more.svg' />
                      </Tooltip>
                    </div>
                    <span>{formatNumbers(crRegister)}</span>
                  </div>
                  <div className='flex flex-col items-center'>
                    <div className='flex items-start'>
                      <ColorLabel backgroundColor={'bg-orange-en'} label={'EN'} />
                      {/* <div className='flex flex-row gap-1 items-center'>
                        <div className='rounded-full bg-orange-en w-3 h-3' />
                        <b>EN</b>
                      </div> */}
                      <Tooltip title={<b>{contentTooltip('amenazadas-global-en')}</b>}>
                        <img src='/images/icon-more.svg' />
                      </Tooltip>
                    </div>
                    <span>{formatNumbers(enRegister)}</span>
                  </div>
                  <div className='flex flex-col items-center'>
                    <div className='flex items-start'>
                      <ColorLabel backgroundColor={'bg-yellow-vu'} label={'VU'} />
                      {/* <div className='flex flex-row gap-1 items-center'>
                        <div className='rounded-full bg-yellow-vu w-3 h-3' />
                        <b>VU</b>
                      </div> */}
                      <Tooltip title={<b>{contentTooltip('amenazadas-global-vu')}</b>}>
                        <img src='/images/icon-more.svg' />
                      </Tooltip>
                    </div>
                    <span>{formatNumbers(vuRegister)}</span>
                  </div>
                </div>
                <div className='flex'>
                  <div className='bg-red-cr h-4 ' style={{ width: calculateWidth(crRegister, +crRegister + +enRegister + +vuRegister) }}></div>
                  <div className='bg-orange-en h-4 ' style={{ width: calculateWidth(enRegister, +crRegister + +enRegister + +vuRegister) }}></div>
                  <div className='bg-yellow-vu h-4 ' style={{ width: calculateWidth(vuRegister, +crRegister + +enRegister + +vuRegister) }}></div>
                </div>
                <div className='flex text-sm gap-x-2 text-blue-green pt-2.5'>
                  <p className='inline-block '><b>{formatNumbers(registros)}</b></p>
                  <p className='inline-block'>Observaciones</p>
                </div>
              </div>
              <div className='flex flex-col pt-5 gap-y-10'>
                <button type='button' className='flex gap-3 justify-center  items-center py-1 border border-black rounded-full w-1/2 lg:w-4/12 self-end cursor-pointer' value={slug} onClick={(e) => updateBreadcrumb(e, selected)}>
                  Ver más
                  <img src='/images/arrow-black.svg' alt='arrow button' />
                </button>
              </div>
            </div>
          })}
        </div>
      </div>
    )
  }
  if (selected.toLowerCase() === 'cites') {
    return (
      <div className='bg-white py-10'>
        <div className='w-10/12 mx-auto flex flex-col lg:flex-row gap-y-6 justify-between'>
          <div className='shadow-md lg:w-2/5 mx-auto flex flex-col justify-center gap-6 py-12 px-8'>
            <div className='flex flex-col items-start justify-start'>
              <span className='text-6xl font-black font-inter'>
                {formatNumbers(info?.especies_cites_total)}
                <div className='border-t border-t-dartmouth-green' />
              </span>
              <div className='font-black font-inter text-lg'>Especies {selected} observadas
                {info.species_list?.length && <CustomTooltip placement='left' title={<Table tabledata={info.species_list} link={explorerLink(slugregion, info?.slug)} />}>
                  <img className='inline-block pl-2' src='/images/icons/icon-table.svg' />
                </CustomTooltip>}
              </div>
              <div className='flex text-sm gap-x-2 text-blue-green'>
                <p className='inline-block '><b>{formatNumbers(info?.registros_cites_total)}</b></p>
                <p className='inline-block'>Observaciones</p>
              </div>
            </div>
            <div className='flex flex-col justify-center h-full w-full'>
              <div className='font-lato flex justify-evenly gap-x-4'>
                <div className='flex flex-col items-center'>
                  <div className='flex items-start'>
                    <ColorLabel backgroundColor={'bg-cerulean'} label={'I'} />
                  </div>
                  <span>{formatNumbers(info?.especies_cites_i)}</span>
                </div>
                <div className='flex flex-col items-center'>
                  <div className='flex items-start'>
                    <ColorLabel backgroundColor={'bg-black'} label={'I/II'} />
                  </div>
                  {/* <div className='flex items-start border-b-2 border-b-black'>
                    <b>I/II</b>
                  </div> */}
                  <span>{formatNumbers(info?.especies_cites_i_ii)}</span>
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
                <div className='bg-cerulean h-4' style={{ width: calculateWidth(+info?.especies_cites_i, +info?.especies_cites_i + +info?.especies_cites_ii + +info?.especies_cites_i_ii + +info?.especies_cites_iii) }}></div>
                <div className='bg-sandstorm h-4' style={{ width: calculateWidth(+info?.especies_cites_ii, +info?.especies_cites_i + +info?.especies_cites_ii + +info?.especies_cites_i_ii + +info?.especies_cites_iii) }}></div>
                <div className='bg-black h-4' style={{ width: calculateWidth(+info?.especies_cites_i_ii, +info?.especies_cites_i + +info?.especies_cites_ii + +info?.especies_cites_i_ii + +info?.especies_cites_iii) }}></div>
                <div className='bg-greenish-cyan h-4' style={{ width: calculateWidth(+info?.especies_cites_iii, +info?.especies_cites_i + +info?.especies_cites_ii + +info?.especies_cites_i_ii + +info?.especies_cites_iii) }}></div>
              </div>
            </div>

          </div>
          <div className='lg:w-[45%] flex flex-col justify-evenly gap-y-3 '>
            <BarPercent
              bgColor={'bg-cerulean'}
              textColor={'text-white'}
              region={region}
              title={'CITES I'}
              datatable={info?.list_especies_cites_i}
              especies={info?.especies_cites_i}
              parentEspecies={info?.cites_i_estimadas}
              registros={info?.registros_cites_i}
              link={explorerLink(slugregion, "cites-i")}

            />
            <BarPercent
              bgColor={'bg-black'}
              textColor={'text-white'}
              region={region}
              title={'CITES I/II'}
              datatable={info?.list_especies_cites_i_ii}
              especies={info?.especies_cites_i_ii}
              parentEspecies={info?.cites_i_ii_estimadas}
              registros={info?.registros_cites_i_ii}
              link={explorerLink(slugregion, "cites-i-ii")}

            />

            <BarPercent
              bgColor={'bg-sandstorm'}
              textColor={'text-white'}
              region={region}
              title={'CITES II'}
              datatable={info?.list_especies_cites_ii}
              especies={info?.especies_cites_ii}
              parentEspecies={info?.cites_ii_estimadas}
              registros={info?.registros_cites_ii}
              link={explorerLink(slugregion, "cites-ii")}
            />
            <BarPercent
              bgColor={'bg-greenish-cyan'}
              textColor={'text-white'}
              region={region}
              title={'CITES III'}
              datatable={info?.list_especies_cites_iii}
              especies={info?.especies_cites_iii}
              parentEspecies={info?.cites_iii_estimadas}
              registros={info?.registros_cites_iii}
              link={explorerLink(slugregion, "cites-iii")}
            />

          </div>
        </div>
      </div>)
  }
  if (selected.toLowerCase() === 'migratorias') {
    return (
      <div className='bg-white py-10'>
        <div className='w-10/12 mx-auto flex flex-col lg:flex-row gap-y-6 justify-between'>
          <div className='lg:w-[45%] shadow-hard flex flex-col py-12 px-8'>
            <CardContentTem
              selected={selected}
              region={region}
              especies={info?.especies_migratorias}
              parentEspecies={info?.migratorias_estimadas}
              registros={info?.registros_migratorias}
              datatable={info?.species_list}
              link={explorerLink(slugregion, info?.slug)} rel="noopener noreferrer"
            />
          </div>
          <div className='lg:w-2/5 flex items-center'>
            <ReactMarkdown className='rc-markdown'>
              {info?.texto}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    )
  }
  if (selected.toLowerCase() === 'endémicas') {
    return (
      <div className='bg-white py-10'>
        <div className='w-10/12 mx-auto flex flex-col md:flex-row justify-between'>
          <div className='lg:w-1/2 shadow-hard py-12 px-8 max-w-[450px]'>
            <CardContentTem
              selected={selected}
              region={region}
              especies={info?.especies_endemicas}
              parentEspecies={info?.endemicas_estimadas}
              registros={info?.registros_endemicas}
              datatable={info?.species_list}
              link={explorerLink(slugregion, info?.slug)}
            />
          </div>
          <div className='w-[45%] flex flex-col justify-evenly gap-y-3 '>
            <Table tabledata={info?.species_list} />
            <div className='flex flex-col pt-5 gap-y-10'>
              <button type='button' className='flex gap-3 justify-center  items-center py-1 border border-black rounded-full w-1/2 lg:w-[42%] self-end cursor-pointer'>
                <a target='_blank' rel="noopener noreferrer" href={`/explorador?${explorerLink(slugregion, info?.slug)}&lista_especies=true`}>Explora lista completa</a>
                <img src='/images/arrow-black.svg' alt='arrow button' />
              </button>
            </div>
            {/* <BarPercent
              bgColor={'bg-red-cr '}
              region={region}
              title={''}
              datatable={ }
              especies={ }
              parentEspecies={ }
              registros={ }
            />

            <BarPercent
              bgColor={'bg-orange-en'}
              region={region}
              title={''}
              datatable={ }
              especies={ }
              parentEspecies={ }
              registros={ }
            />
            <BarPercent
              bgColor={'bg-yellow-vu'}
              region={region}
              title={''}
              datatable={ }
              especies={ }
              parentEspecies={ }
              registros={ }
            /> */}

          </div>

        </div>
      </div>
    )
  }
  if (selected.toLowerCase() === 'exóticas' || selected.toLowerCase() === 'exóticas total' ||
      selected.toLowerCase() === 'exóticas con riesgo de invasión' ||
      selected.toLowerCase() === 'invasoras' || selected.toLowerCase() === 'trasplantadas') {
    return (
      <div className='bg-white py-10'>
        <div className='w-10/12 mx-auto flex flex-col lg:flex-row gap-y-6 justify-between'>
          <div className='lg:w-2/5 shadow-hard  py-12 px-8'>
            <CardContentTem
              selected={selected}
              region={region}
              especies={
                selected.toLowerCase() === 'exóticas'
                  ? info?.especies_exoticas
                  : selected.toLowerCase() === 'exóticas con riesgo de invasión'
                    ? info?.especies_exoticas_riesgo_invasion_total
                    : selected.toLowerCase() === 'invasoras'
                      ? info?.especies_invasoras
                      : selected.toLowerCase() === 'trasplantadas'
                        ? info?.especies_trasplantadas
                        : info?.especies_exoticas_total
              }
              parentEspecies={
                selected.toLowerCase() === 'exóticas'
                  ? info?.exoticas_estimadas
                  : selected.toLowerCase() === 'exóticas con riesgo de invasión'
                    ? info?.exoticas_riesgo_invasion_estimadas
                    : selected.toLowerCase() === 'invasoras'
                      ? info?.exoticas_invasoras_estimadas
                      : selected.toLowerCase() === 'trasplantadas'
                        ? info?.exoticas_trasplantadas_estimadas
                        : info?.exoticas_total_estimadas
              }
              registros={
                selected.toLowerCase() === 'exóticas'
                  ? info?.registros_exoticas
                  : selected.toLowerCase() === 'exóticas con riesgo de invasión'
                    ? info?.registros_exoticas_riesgo_invasion_total
                    : selected.toLowerCase() === 'invasoras'
                      ? info?.registros_invasoras
                      : selected.toLowerCase() === 'trasplantadas'
                        ? info?.registros_trasplantadas
                        : info?.registros_exoticas_total
              }
              datatable={
                selected.toLowerCase() === 'exóticas'
                  ? info?.list_especies_exoticas
                  : selected.toLowerCase() === 'exóticas con riesgo de invasión'
                    ? info?.list_especies_exoticas_riesgo_invasion_total
                    : selected.toLowerCase() === 'invasoras'
                      ? info?.list_especies_invasoras
                      : selected.toLowerCase() === 'trasplantadas'
                        ? info?.list_especies_trasplantadas
                        : info?.list_especies_exoticas_total
              }
              link={explorerLink(slugregion,
                selected.toLowerCase() === 'exóticas'
                  ? 'exoticas'
                  : selected.toLowerCase() === 'exóticas con riesgo de invasión'
                    ? 'exoticas-riesgo-invasion-total'
                    : selected.toLowerCase() === 'invasoras'
                      ? 'invasoras'
                      : selected.toLowerCase() === 'trasplantadas'
                        ? 'trasplantadas'
                        : info?.slug
              )}
            />

          </div>

          <div className='lg:w-[45%] flex flex-col justify-evenly gap-y-3 '>
            <BarPercent
              bgColor={'bg-orange-en'}
              region={region}
              title={'Exóticas'}
              datatable={info?.list_especies_exoticas}
              especies={info?.especies_exoticas}
              parentEspecies={info?.exoticas_estimadas}
              registros={info?.registros_exoticas}
              link={explorerLink(slugregion, "exoticas")}
            />
            <BarPercent
              bgColor={'bg-orange-en'}
              region={region}
              title={'Exóticas con potencial de invasión'}
              datatable={info?.list_especies_exoticas_riesgo_invasion_total}
              especies={info?.especies_exoticas_riesgo_invasion_total}
              parentEspecies={info?.exoticas_riesgo_invasion_estimadas}
              registros={info?.registros_exoticas_riesgo_invasion_total}
              link={explorerLink(slugregion, "exoticas-riesgo-invasion-total")}
            />
            <BarPercent
              bgColor={'bg-orange-en'}
              region={region}
              title={'Invasoras'}
              datatable={info?.list_especies_invasoras}
              especies={info?.especies_invasoras}
              parentEspecies={info?.exoticas_invasoras_estimadas}
              registros={info?.registros_invasoras}
              link={explorerLink(slugregion, "invasoras")}
            />
            <BarPercent
              bgColor={'bg-orange-en'}
              region={region}
              title={'Trasplantadas'}
              datatable={info?.list_especies_trasplantadas}
              especies={info?.especies_trasplantadas}
              parentEspecies={info?.exoticas_trasplantadas_estimadas}
              registros={info?.registros_trasplantadas}
              link={explorerLink(slugregion, "trasplantadas")}
            />

          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='bg-white py-10'>
      <div className='w-10/12 mx-auto flex justify-between'>
        <div className='max-w-[45%] w-full shadow-md flex flex-col justify-center gap-6 py-12 px-8'>
          <div className='flex flex-col items-start justify-start'>
            <span>Categoría {capitalize(info?.slug.replace('amenazadas-', '')) === 'Global' ? <><Abbr sigla="UICN" /> Global</> : 'Nacional'}</span>
            <span className='text-6xl font-black font-inter'>
              {formatNumbers(info?.especies)}
              <div className='border-t border-t-dartmouth-green' />
            </span>
            <div className='font-black font-inter text-lg'>Especies amenazadas
              {info?.species_list?.length !== 0 && <CustomTooltip placement='left' title={<Table tabledata={info?.slug === 'amenazadas-global' ? info?.list_especies_amenazadas_global : info?.list_especies_amenazadas_nacional} link={explorerLink(slugregion, info?.slug)} />}>
                <img className='inline-block pl-2' src='/images/icons/icon-table.svg' />
              </CustomTooltip>}
            </div>
          </div>
          <div className='flex flex-col justify-center h-full w-full'>
            <div className='font-lato flex justify-evenly gap-x-4'>
              <div className='flex flex-col items-center'>
                <div className='flex items-start'>
                  <ColorLabel backgroundColor={'bg-red-cr'} label={'CR'} />
                  <Tooltip title={<b>{contentTooltip('amenazadas-global-cr')}</b>}>
                    <img src='/images/icon-more.svg' />
                  </Tooltip>
                </div>
                <span>{formatNumbers(info?.cr)}</span>
              </div>
              <div className='flex flex-col items-center'>
                <div className='flex items-start'>
                  <ColorLabel backgroundColor={'bg-orange-en'} label={'EN'} />
                  <Tooltip title={<b>{contentTooltip('amenazadas-global-en')}</b>}>
                    <img src='/images/icon-more.svg' />
                  </Tooltip>
                </div>
                <span>{formatNumbers(info?.en)}</span>
              </div>
              <div className='flex flex-col items-center'>
                <div className='flex items-start'>
                  <ColorLabel backgroundColor={'bg-yellow-vu'} label={'VU'} />
                  <Tooltip title={<b>{contentTooltip('amenazadas-global-vu')}</b>}>
                    <img src='/images/icon-more.svg' />
                  </Tooltip>
                </div>
                <span>{formatNumbers(info?.vu)}</span>
              </div>
            </div>
            <div className='flex'>
              <div className='bg-red-cr h-4 ' style={{ width: calculateWidth(+info?.cr_registros, +info?.cr_registros + +info?.en_registros + +info?.vu_registros) }}></div>
              <div className='bg-orange-en h-4 ' style={{ width: calculateWidth(+info?.en_registros, +info?.cr_registros + +info?.en_registros + +info?.vu_registros) }}></div>
              <div className='bg-yellow-vu h-4 ' style={{ width: calculateWidth(+info?.vu_registros, +info?.cr_registros + +info?.en_registros + +info?.vu_registros) }}></div>
            </div>
            <div className='flex text-sm gap-x-2 text-blue-green pt-2.5'>
              <p className='inline-block '><b>{formatNumbers(info?.registros)}</b></p>
              <p className='inline-block'>Observaciones</p>
            </div>
          </div>
        </div>
        <div className='w-[45%] flex flex-col justify-evenly gap-y-3 '>

          <BarPercent
            cat='amenazadas'
            label='en peligro crítico'
            bgColor={'bg-red-cr'}
            region={region}
            title={'CR'}
            datatable={info?.slug === 'amenazadas-global' ? info?.list_especies_amenazadas_global_cr : info?.list_especies_amenazadas_nacional_cr}
            especies={info?.cr}
            parentEspecies={info?.cr_estimadas || info?.parent_cr_estimadas}
            registros={info?.cr_registros}
            link={explorerLink(slugregion, `${info?.slug}-cr`)}
          />

          <BarPercent
            cat='amenazadas'
            label='en peligro'
            bgColor={'bg-orange-en'}
            region={region}
            title={'EN'}
            datatable={info?.slug === 'amenazadas-global' ? info?.list_especies_amenazadas_global_en : info?.list_especies_amenazadas_nacional_en}
            especies={info?.en}
            parentEspecies={info?.en_estimadas || info?.parent_en_estimadas}
            registros={info?.en_registros}
            link={explorerLink(slugregion, `${info?.slug}-en`)}
          />
          <BarPercent
            cat='amenazadas'
            label='vulnerables'
            bgColor={'bg-yellow-vu'}
            region={region}
            title={'VU'}
            datatable={info?.slug === 'amenazadas-global' ? info?.list_especies_amenazadas_global_vu : info?.list_especies_amenazadas_nacional_vu}
            especies={info?.vu}
            parentEspecies={info?.vu_estimadas || info?.parent_vu_estimadas}
            registros={info?.vu_registros}
            link={explorerLink(slugregion, `${info?.slug}-vu`)}
          />

        </div>
      </div>
    </div>
  )

  /* return (
    null
  ) */

  /* return (
    <div className='bg-white py-10'>
      <div className='w-10/12 mx-auto flex justify-between'>
        <div className='max-w-[45%] w-full shadow-md flex flex-col justify-center gap-6 py-12 px-8'>
          <div className='flex flex-col items-start justify-start'>
            <span>Categoría {capitalize(info?.slug.replace('amenazadas-', '')) === 'Global' ? <><Abbr sigla="UICN" /> Global</> : 'Nacional'}</span>
            <span className='text-6xl font-black font-inter'>
              {formatNumbers(info?.especies)}
              <div className='border-t border-t-dartmouth-green' />
            </span>
            <div className='font-black font-inter text-lg'>Especies amenazadas
              {info?.species_list?.length !== 0 && <CustomTooltip placement='left' title={<Table tabledata={info?.species_list} link={explorerLink(slugregion, info?.slug)} />}>
                <img className='inline-block pl-2' src='/images/icons/icon-table.svg' />
              </CustomTooltip>}
            </div>
          </div>
          <div className='flex flex-col justify-center h-full w-full'>
            <div className='font-lato flex justify-evenly gap-x-4'>
              <div className='flex flex-col items-center'>
                <div className='flex items-start'>
                  <ColorLabel backgroundColor={'bg-red-cr'} label={'CR'} />
                  <Tooltip title={<b>{contentTooltip('amenazadas-global-cr')}</b>}>
                    <img src='/images/icon-more.svg' />
                  </Tooltip>
                </div>
                <span>{formatNumbers(info?.cr)}</span>
              </div>
              <div className='flex flex-col items-center'>
                <div className='flex items-start'>
                  <ColorLabel backgroundColor={'bg-orange-en'} label={'EN'} />
                  <Tooltip title={<b>{contentTooltip('amenazadas-global-en')}</b>}>
                    <img src='/images/icon-more.svg' />
                  </Tooltip>
                </div>
                <span>{formatNumbers(info?.en)}</span>
              </div>
              <div className='flex flex-col items-center'>
                <div className='flex items-start'>
                  <ColorLabel backgroundColor={'bg-yellow-vu'} label={'VU'} />
                  <Tooltip title={<b>{contentTooltip('amenazadas-global-vu')}</b>}>
                    <img src='/images/icon-more.svg' />
                  </Tooltip>
                </div>
                <span>{formatNumbers(info?.vu)}</span>
              </div>
            </div>
            <div className='flex'>
              <div className='bg-red-cr h-4 ' style={{ width: calculateWidth(+info?.cr_registros, +info?.cr_registros + +info?.en_registros + +info?.vu_registros) }}></div>
              <div className='bg-orange-en h-4 ' style={{ width: calculateWidth(+info?.en_registros, +info?.cr_registros + +info?.en_registros + +info?.vu_registros) }}></div>
              <div className='bg-yellow-vu h-4 ' style={{ width: calculateWidth(+info?.vu_registros, +info?.cr_registros + +info?.en_registros + +info?.vu_registros) }}></div>
            </div>
            <div className='flex text-sm gap-x-2 text-blue-green pt-2.5'>
              <p className='inline-block '><b>{formatNumbers(info?.registros)}</b></p>
              <p className='inline-block'>Observaciones</p>
            </div>
          </div>
        </div>
        <div className='w-[45%] flex flex-col justify-evenly gap-y-3 '>

          <BarPercent
            cat='amenazadas'
            label='en peligro crítico'
            bgColor={'bg-red-cr'}
            region={region}
            title={'CR'}
            especies={info?.cr}
            parentEspecies={info?.cr_estimadas}
            registros={info?.cr_registros}
            link={`region=${slugregion}&tematica=${info?.slug}&grupo=tematica`}
          />

          <BarPercent
            cat='amenazadas'
            label='en peligro'
            bgColor={'bg-orange-en'}
            region={region}
            title={'EN'}
            especies={info?.en}
            parentEspecies={info?.en_estimadas}
            registros={info?.en_registros}
            link={`region=${slugregion}&tematica=${info?.slug}&grupo=tematica`}
          />
          <BarPercent
            cat='amenazadas'
            label='vulnerables'
            bgColor={'bg-yellow-vu'}
            region={region}
            title={'VU'}
            especies={info?.vu}
            parentEspecies={info?.vu_estimadas}
            registros={info?.vu_registros}
            link={`region=${slugregion}&tematica=${info?.slug}&grupo=tematica`}
          />

        </div>
      </div>
    </div>

  ) */
}
CardTematicasCol.propTypes = {
  info: PropTypes.object,
  selected: PropTypes.string,
  updateBreadcrumb: PropTypes.func
}

export default CardTematicasCol
