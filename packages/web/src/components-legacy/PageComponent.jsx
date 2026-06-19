import CardTematicas from './CardTematicas'
import Gallery from './Gallery'
import ContentElement from './ContentElement'

import MenuExplorer from './MenuExplorer'
import PublishersCard from './PublishersCard'
import SimpleSlider from './Slider'
import Slides from './Slides'
import CardTematicasCol from './CardTematicasCol'

import InfoPublishers from './InfoPublishers.jsx'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'

import MapMunicipios from './MapMunicipios'
import MapDepartamentos from './MapDepartamentos'
import MapRegionAmazonia from './MapRegionAmazonia'
import StickyNavbar from './StickyNavbar'

function GruposSectionSkeleton ({ title, regionLabel }) {
  return (
    <div className='py-10 bg-white-2'>
      <div className='mx-auto w-10/12 max-w-screen-2xl'>
        <div className='space-y-2.5'>
          <p className='3xl:text-lg'>
            Conoce las cifras de {regionLabel === 'Región Amazonía' ? 'la región Amazonía' : regionLabel} por
          </p>
          <h2 className='font-black font-inter text-3xl 3xl:text-4xl'>{title}</h2>
        </div>
        <div role='status' aria-label={`Cargando ${title}`} className='mt-[45.52px] animate-pulse'>
          <div className='flex flex-wrap gap-2 mb-6'>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className='h-8 w-28 bg-gray-200 rounded-full' />
            ))}
          </div>
          <div className='h-[420px] bg-gray-100 rounded' />
        </div>
      </div>
    </div>
  )
}

export default function PageComponent ({ data, slug, municipality, municipalityflag = false, isScale = false, map, gruposBioLoading = false, gruposIntLoading = false }) {
  const {
    general_info: generalInfo,
    grupos_biologicos: gruposBiologicos,
    grupos_interes: gruposInteres,
    nav_grupo_biologico: navGruposBiologicos,
    nav_grupo_interes: navGruposInteres,
    nav_tematica: navTematica,
    nav_territorio: navTerritorio,
    tematica,
    patrocinador,
    publicadores,
    slides,
    territorio,
    gallery
  } = data

  const navigate = useNavigate()
  /* const [publishers, savePublishers] = useLocalStorage('publishers', []) */

  const handlePublishers = () => {
    localStorage.setItem('publishers', JSON.stringify(Array.isArray(publicadores)
      ? publicadores.map(p => ({
        ...p,
        region: slug,
        slug: p.slug_publicador.map(p => ({
          ...p,
          region: slug,
          slug: p.slug_publicador
        }))
      }))
      : publicadores.publicadores_list))

    if (generalInfo.label === 'La Planada') {
      navigate('/mas/publicadores?region=reserva-forestal-la-planada')
    } else if (generalInfo.label === 'Pialapí Pueblo-Viejo') {
      navigate('/mas/publicadores?region=resguardo-indigena-pialapi-pueblo-viejo')
    } else if (municipalityflag === true) {
      navigate(`/mas/publicadores?region=${slug}&area=${municipality}`)
    } else {
      navigate(`/mas/publicadores?region=${slug}`)
    }
  }

  return (
    <>
      {gallery.length !== 0 && <Gallery gallery={gallery} />}
      {slides && slides.length > 0 && (
        <div className='bg-white-3 pt-3 mt-3 mb-0'>
          <div className='mx-auto w-10/12 max-w-screen-2xl'>
            <SimpleSlider dots infinite={slides.length > 1} slidestoshow={1} responsiveSlidesToShow={1}>
              {slides.map((element, key) =>
                <Slides key={key} data={element} region={generalInfo.label} municipalityflag={municipalityflag} parentlabel={generalInfo.parent_label} />
              )}
            </SimpleSlider>
          </div>
        </div>
      )}

      {/* Sticky Navbar Navigation */}
      <StickyNavbar generalInfo={generalInfo} slug={slug} municipalityflag={municipalityflag} />

      {/* Grupos Tematicas */}
      {navTematica.length !== 0 && tematica.length !== 0 && <div id="tematicas" className='py-10 bg-white-2'>
        <div className='mx-auto w-10/12 max-w-screen-2xl'>
          <MenuExplorer tree={navTematica} search={tematica} initialSelected='Amenazadas' initialSelectedValue='amenazadas'>
            <MenuExplorer.Title>
              <p className='3xl:text-lg'>
                Conoce las cifras de {generalInfo.label === 'Región Amazonía' ? 'la región Amazonía' : generalInfo.label} por
              </p>
              <h2 className='font-black font-inter text-3xl 3xl:text-4xl'>
                Temáticas
              </h2>
            </MenuExplorer.Title>
            <MenuExplorer.Tree className='relative mt-[45.52px]' slidestoshow={4} />
            <MenuExplorer.Breadcrumb className="bg-white w-full flex items-center gap-x-2 mt-5 pl-5" />
            <MenuExplorer.Body >
              {(selected, info, updateBreadcrumb) => (
                slug === 'colombia'
                  ? (<CardTematicasCol slugregion={slug} info={info} selected={selected} updateBreadcrumb={updateBreadcrumb} region={generalInfo.label} />)
                  : (<CardTematicas slugregion={slug} parentlabel={['La Planada', 'Pialapí Pueblo-Viejo'].includes(generalInfo.label) ? generalInfo.label : generalInfo.parent_label} info={info} selected={selected} updateBreadcrumb={updateBreadcrumb} region={generalInfo.label} municipalityflag={municipalityflag} especiesObservadas={generalInfo.especies_region_total} />)

              )}
            </MenuExplorer.Body>
          </MenuExplorer>
        </div>
      </div>}

      {/* Grupos Biologicos — pulse skeleton until the parallel
          /grupos?tipo=biologico request resolves; banner above
          renders immediately because that data lives in the
          ?lean=1 bundle. */}
      {gruposBioLoading
        ? <div id="grupos-biologicos"><GruposSectionSkeleton title='Grupos Biológicos' regionLabel={generalInfo.label} /></div>
        : (gruposBiologicos && gruposBiologicos.length > 0 && <div id="grupos-biologicos" className='py-10 bg-white-2'>
        <div className='mx-auto w-10/12 max-w-screen-2xl'>
          <MenuExplorer tree={navGruposBiologicos} search={gruposBiologicos} initialSelected='Animales' initialSelectedValue='animales'>
            <MenuExplorer.Title>
              <p className='3xl:text-lg'>
                Conoce las cifras de {generalInfo.label === 'Región Amazonía' ? 'la región Amazonía' : generalInfo.label} por
              </p>
              <h2 className='font-black font-inter text-3xl 3xl:text-4xl'>
                Grupos Biológicos
              </h2>
            </MenuExplorer.Title>
            <MenuExplorer.Tree className='relative mt-[45.52px]' />
            <MenuExplorer.Breadcrumb className="bg-white w-full flex items-center gap-x-2 mt-5 pl-5" />
            <MenuExplorer.Body >
              {(selected, info) => (
                <ContentElement slug={slug} selected={selected} info={info} parentlabel={generalInfo.parent_label} region={generalInfo.label} observadasCol={generalInfo.especies_region_total} municipalityflag={municipalityflag} />
              )}
            </MenuExplorer.Body>
          </MenuExplorer>
        </div>
      </div>)}

      {/* Grupos Interes — same progressive-load story as biologicos. */}
      {gruposIntLoading
        ? <div id="grupos-interes"><GruposSectionSkeleton title='Grupos de interés' regionLabel={generalInfo.label} /></div>
        : (navGruposInteres.length !== 0 && gruposInteres && gruposInteres.length !== 0 && <div id="grupos-interes" className='py-10 bg-white-2'>
        <div className='mx-auto w-10/12 max-w-screen-2xl'>
          <MenuExplorer tree={navGruposInteres} search={gruposInteres} initialSelected='Epífitas' initialSelectedValue='epifitas'>
            <MenuExplorer.Title>
              <p className='3xl:text-lg'>
                Conoce las cifras de {generalInfo.label === 'Región Amazonía' ? 'la región Amazonía' : generalInfo.label} por
              </p>
              <h2 className='font-black font-inter text-3xl 3xl:text-4xl'>
                Grupos de interés
              </h2>
            </MenuExplorer.Title>
            <MenuExplorer.Tree className='relative mt-[45.52px]' />
            <MenuExplorer.Breadcrumb className="bg-white w-full flex items-center gap-x-2 mt-5 pl-5" />
            <MenuExplorer.Body>
              {(selected, info) => (
                <ContentElement slug={slug} selected={selected} info={info} parentlabel={generalInfo.parent_label} region={generalInfo.label} observadasCol={generalInfo.especies_region_total} municipalityflag={municipalityflag} />
              )}
            </MenuExplorer.Body>
          </MenuExplorer>
        </div>
      </div>)}

      {/* Conoce las cifras por regiones.
          Skip when the first territorio section is just self-referential
          (single-area entities like reserva-forestal-la-planada or
          resguardo-indigena-pialapi-pueblo-viejo, where map_data only
          contains the entity itself). Prod hides the whole "Conoce las
          cifras por Municipios" block in those cases. */}
      {territorio.length !== 0 && navTerritorio.length !== 0 && slug !== 'region-amazonia' && (territorio[0]?.map_data?.length ?? 0) > 1 && <div id="territorio" className='py-10 bg-white-2'>
        <div className='mx-auto w-10/12 max-w-screen-2xl'>
          <MenuExplorer tree={navTerritorio} search={territorio} initialSelected='Municipios' initialSelectedValue='municipios'>
            <MenuExplorer.Title>
              <p className='3xl:text-lg'>
                Conoce las cifras de {generalInfo.label === 'Región Amazonía' ? 'la región Amazonía' : generalInfo.label} por
              </p>
              <h2 className='font-black font-inter text-3xl 3xl:text-4xl'>
                {generalInfo.label === 'Colombia' ? 'Departamentos' : 'Municipios'}
              </h2>
            </MenuExplorer.Title>
            {/* <MenuExplorer.Tree className='relative mt-12' /> */}
            <MenuExplorer.Body>
              {(selected, info) => (
                <div className='bg-white'>
                  {/* {info?.charts.length === 0
                    ? (<div className='text-center text-3xl py-20 w-4/5 mx-auto'>
                      Conoce más en {' '}
                      <a href={info?.link} className='underline text-azure'>{info?.label}</a>
                    </div>) */}
                                    <>
                    <div>
                      {territorio && slug !== 'region-amazonia' &&
                        <>
                          <div className={`mt-3 ${generalInfo.label === 'Colombia' ? 'md:h-[700px]' : 'md:h-[600px]'}`}>
                            {generalInfo.label === 'Colombia'
                              ? (
                                  <MapDepartamentos data={map} isScale={isScale} departamentos={data.departamentos_lista} />
                                )
                              : (
                                  <MapMunicipios data={map} isScale={isScale} slug={slug} municipios={data.municipios_lista} />
                                )}
                          </div>
                        </>
                      }
                    </div>
                    {/* <SimpleSlider dots>
                        {info?.charts.map((element, key) =>
                          <Slides key={key} data={element} />
                        )}
                      </SimpleSlider> */}
                  </>
                </div>
              )}
            </MenuExplorer.Body>
          </MenuExplorer>
        </div>
      </div>
      }

      {/* Conoce las cifras por departamentos - la región Amazonía */}
      {slug === 'region-amazonia' && <div id="territorio" className='py-10 bg-white-2'>
        <div className='mx-auto w-10/12 max-w-screen-2xl'>
          <div className='space-y-2.5'>
            <p className='3xl:text-lg'>
              Explora el aporte departamental de
            </p>
            <h2 className='font-black font-inter text-3xl 3xl:text-4xl'>
              Especies y observaciones en la región Amazonía
            </h2>
          </div>
          <div className='mt-3' style={{ height: 600 }}>
            <MapRegionAmazonia />
          </div>
        </div>
      </div>
      }
      {/* Publicadores */}
      <div id="publicadores" className='py-10 bg-white-smoke'>
        <div className='mx-auto w-10/12 max-w-screen-2xl'>
          <div className='space-y-2.5'>
            <h2 className='font-black font-inter text-3xl 3xl:text-4xl'>
              Publicadores de {generalInfo.label === 'Región Amazonía' ? 'la región Amazonía' : generalInfo.label}
            </h2>
            <div className='h-0.5 bg-gradient-to-r from-dartmouth-green to-yellow-green' />
          </div>
          <div className='py-4 space-y-5'>
            <InfoPublishers total={Array.isArray(publicadores) ? publicadores : publicadores.publicadores_list} data={Array.isArray(publicadores) ? publicadores : publicadores.publicadores_tipo} region={generalInfo} />
            <SimpleSlider slidesToScroll={4} slidestoshow={4} >
              {
                Array.isArray(publicadores)
                  ? (publicadores.map((item, index) =>
                    <div key={index} className='px-2'>
                      <PublishersCard link={item.url_socio} truncate title={item.label} imagePath={item.url_logo || '/images/un-icon.png'} totalEspecies={item.especies} observationsQuantity={item.registros} country={item.pais_publicacion} />
                    </div>
                    ))
                  : (
                      publicadores.publicadores_list.map((item, index) =>
                      <div key={index} className='px-2'>
                        <PublishersCard link={item.url_socio} truncate title={item.label} imagePath={item.url_logo || '/images/un-icon.png'} totalEspecies={item.especies} observationsQuantity={item.registros} country={item.pais_publicacion} />
                      </div>
                      )
                    )
              }
            </SimpleSlider>
          </div>
          <div className='text-center'>
            <button className='inline-block border border-burnham rounded-full py-1.5 px-5 cursor-pointer hover:shadow-default hover:text-blue-green hover:border-none' onClick={() => handlePublishers()} >
              Todos los publicadores
            </button>
          </div>
        </div>
      </div>
      {/* explorador */}
      {/* {slug !== 'region-amazonia' && (
        <div id="explorador" className='py-10 mx-auto w-10/12 max-w-screen-xl'>
        <div className='mx-auto max-w-md text-center'>
          <div className='space-y-6'>
            <h2 className='font-black font-lato text-3xl 3xl:text-4xl'>
              Explora {generalInfo.label}
            </h2>
                <p className='3xl:text-lg'>
                  Utiliza nuestro explorador para visualizar las tablas completas de información y explorar con múltiples cruces y gráficos la información disponible para esta región.
                </p>
                <details>
                  <summary className='mx-auto md:w-4/6 flex justify-center items-center gap-x-2 border border-black rounded-full py-2  cursor-pointer'>
                    <p>
                      Cómo funciona esta herramienta
                    </p>
                    <img className='rotate-90' src="/images/arrow-black.svg" alt="arrow app" />
                  </summary>
                  <div className='mt-4'>
                    <p className='text-left'>
                      En la barra de la izquierda puedes seleccionar diferentes valores para los datos, si los quieres ver por registros o especies o filtrarlos para cada una de las temáticas de especies amenazadas, objeto de comercio, etc. En el panel de la derecha puedes ver los resultados como tablas o gráficos dependiendo de las opciones que selecciones.
                    </p>
                  </div>
                </details>
            </div>
          </div>
        </div>
      )} */}

      {patrocinador.length !== 0 && <div className='py-10 bg-white'>
        <div className='mx-auto w-10/12 lg:w-9/12 max-w-screen-xl'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-8'>
            <p className='font-bold text-lg 3xl:text-xl'>
              Con el apoyo de
            </p>
            {patrocinador.map((el, key) =>
              <a key={key} href={el.url} target='_blank' rel="noreferrer" aria-label={el.titulo}>
                {el.imagen
                  ? <img className='h-28 w-28 mx-auto' src={el.imagen} alt={el.titulo} />
                  : <div className='font-bold'>{el.titulo}</div>
                }
              </a>)}

          </div>
        </div>
      </div>}
    </>
  )
}
