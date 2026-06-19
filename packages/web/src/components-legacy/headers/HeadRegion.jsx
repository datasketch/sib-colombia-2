import { formatNumbers } from '../lib/functions'
import PropTypes from 'prop-types'
import ReactMarkdown from 'react-markdown'
import Concentric from '../Concentric'
import classNames from 'classnames'
import InfoTooltip from '../InfoTooltip'
import { useEffect, useState } from 'react'
// SmallMap was lazy-loaded; not used in the current rendering path

function HeadRegion ({ slug, title, description, imageMap, especiesEstimadas, especiesObservadas, marine = false, municipality = false, referencia, photoLabel, isScale = false, map, imageSmallDpto }) {
  const [smallImageLoaded, setSmallImageLoaded] = useState(false)
  const [smallImageError, setSmallImageError] = useState(false)
  const [windowWidth, setWindowWidth] = useState(1000)

  useEffect(() => {
    window.addEventListener('resize', () => {
      setWindowWidth(window.innerWidth)
    })
    return () => {
      window.removeEventListener('resize', () => {
        setWindowWidth(window.innerWidth)
      })
    }
  }, [])

  useEffect(() => {
    if (imageSmallDpto) {
      const img = new Image()
      img.onload = () => setSmallImageLoaded(true)
      img.onerror = () => setSmallImageError(true)
      img.src = '/' + imageSmallDpto
    }
  }, [imageSmallDpto])

  return (
    <>
      <div className={classNames('bg-cover bg-center pt-8 lg:pt-14 pb-3.5 h-[550px] ')} style={{ backgroundImage: 'url("/images/banner-principales/santander.jpg")' }}>
        <div className="w-full max-w-screen-2xl mx-auto">
          <div className="min-h-[210px] mt-4 lg:mt-5 flex md:justify-between items-center w-10/12 mx-auto">
            <div className={classNames('font-black lg:w-2/3 font-inter text-white text-6xl', title?.length >= 17 ? 'lg:text-[66px]' : 'lg:text-7xl')}>{title}</div>

            {imageSmallDpto && smallImageLoaded && !smallImageError
              ? (
                  <div className="hidden md:flex justify-end ">
                    <img className="h-40 min-w-[240px] md:w-4/5" src={'/' + imageSmallDpto} />
                  </div>
                )
              : (
                  <div className='relative'>
                    <div className='flex flex-row mt-10 px-7'>
                      <div>
                        <img className="h-40 min-w-[240px] md:w-4/5" src={'/' + imageMap} />
                      </div>
                      {slug !== 'colombia' && (
                        <div className='w-20 h-[123px] flex items-center'>
                          <img className='w-full' src={`/api/locator/${slug}.svg`} alt={`Ubicación de ${slug} en Colombia`} />
                        </div>
                      )}
                    </div>
                  </div>
                )}

          </div>
          <div className="flex flex-col md:flex-row max-h-48 justify-between gap-y-4 w-10/12 mx-auto -mt-9 md:-mt-0">
            {/*
              Show the Concentric arc + "Especies estimadas" only when we have
              a real estimate. Region-amazonia and similar regions without an
              IUCN/literature estimate render `null` for especies_region_estimadas;
              prod hides the comparison entirely in that case.
            */}
            {!municipality && slug !== 'bogota-dc' && slug !== 'san-andres-y-providencia' && especiesEstimadas != null && +especiesEstimadas > 0
              ? (<div className="w-1/2 relative flex items-center">
                <Concentric inner={especiesObservadas} outer={especiesEstimadas} movil={windowWidth < 450} />
                <div className={classNames(windowWidth < 450 ? 'left-[11.5rem]' : 'left-[15rem]', 'absolute w-full md:w-1/3 lg:w-full  text-white flex -space-y-1 flex-col -top-[9%]  lg:-top-[8%] left-[15rem] md:left-60')}>
                  <span className="font-inter font-black lg:text-xl">{formatNumbers(especiesEstimadas)}</span>
                  <div className="font-lato text-sm lg:text-base">Especies estimadas
                    {referencia && <InfoTooltip classname={'inline-flex ml-0.5'} place='right' label={referencia} src={'/images/icons/icon-information.svg'} id={'ref'} />}
                  </div>
                </div>

                <div className={classNames(windowWidth < 450 ? 'left-[11.5rem]' : 'left-[15rem]', 'absolute text-yellow-green flex flex-col -space-y-1 w-full md:w-1/3 lg:w-full top-[38%] md:top-[40%] lg:top-[35%]  md:left-60')}>
                  <span className="text-lg lg:text-4xl font-black font-inter">{formatNumbers(especiesObservadas)}</span>
                  <span className="font-lato text-sm lg:text-lg">Especies observadas</span>
                  <div className='flex gap-x-2 pt-1.5'>
                    <img className='h-4 w-10' src='/images/icons/icon-green-continentales.svg' />
                    {marine && <img className='h-4 w-10' src='/images/icons/icon-green-marinas.svg' />}
                  </div>
                </div>
              </div>)
              : (<div className="text-yellow-green mx-auto flex flex-col justify-center  gap-x-4">
                <span className="text-lg lg:text-4xl font-black font-inter">{formatNumbers(especiesObservadas)}</span>
                <div>
                  <span className="font-lato text-sm lg:text-lg">Especies observadas</span>
                  <div className='flex gap-x-2 pt-1.5'>
                    <img className='h-4 w-10' src='/images/icons/icon-green-continentales.svg' />
                    {marine && <img className='h-4 w-10' src='/images/icons/icon-green-marinas.svg' />}
                  </div>
                </div>
              </div>)
            }

            <div className="md:w-1/2 my-auto h-40 border-t-2 md:border-l-2 md:border-t-0 border-yellow-green border-dotted flex items-center py-2.5">
              <ReactMarkdown className='text-white text-sm lg:text-base  w-10/12 mx-auto'>
                {description}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
      {photoLabel && (
        <div className='max-w-screen-xl w-9/12 mx-auto flex justify-end relative'>
          <div className='absolute -top-10 flex gap-2'>
            {photoLabel && <InfoTooltip label={photoLabel} src={'/images/camera-icon.svg'} id={'photo'} />}
          </div>
        </div>
      )}
    </>

  )
}
HeadRegion.propTypes = {
  title: PropTypes.string.isRequired,
  imageMap: PropTypes.string
}

export default HeadRegion
