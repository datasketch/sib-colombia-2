/* eslint-disable camelcase */

import ReactMarkdown from 'react-markdown'
import WaffleChart from './WaffleChart'
import GraphsTopMun from './GraphsTopMun'

const ListRender = ({ texts }) => {
  const text = texts.split(': ')[0]
  const joinText = text + ':'
  const listItimes = texts.split(': ')[1].split(', ')
  return (
    <>
      <ReactMarkdown className='3xl:text-lg'>
        {joinText}
      </ReactMarkdown>
      <ul className='pl-8'>
        {listItimes.map((element, i) => {
          const lastItem = i === listItimes.length - 1
          const elementText = lastItem ? element.replace(/\.$/, '') : element
          return (
            <li key={i} className='list-disc' >
              <ReactMarkdown className='3xl:text-lg'>
                {elementText}
              </ReactMarkdown>
            </li>
          )
        })}
      </ul>
    </>
  )
}

const Slides = ({ data, region, municipalityflag, parentlabel }) => {
  const { layout, title, description, texts, path } = data

  if (layout === 'title/chart') {
    return (
      <div className="px-5">
        <div>
          <div className='flex flex-col items-center lg:justify-between gap-y-3 lg:gap-y-6'>
            <h2 className='text-black-2 font-black text-center text-3xl 3xl:text-4xl'>
              {title}
            </h2>
            <iframe className='w-11/12 mx-auto h-[350px]' src={'/' + path} alt={title} />
          </div>
        </div>
      </div>

    )
  }

  if (layout === 'title/(text|chart)') {
    return (
      <div className="px-5">
        <div>
          <div className=' flex flex-col items-center lg:flex-row justify-between lg:gap-x-12'>
            <div className='flex flex-col justify-start items-start lg:w-6/12 max-w-[586px]'>
              <h2 className='text-black-2 font-black text-2xl 3xl:text-4xl'>
                {title}
              </h2>
              <p className='text-lg 3xl:text-2xl mt-10'>
                {description}
              </p>
            </div>
            <div className='lg:w-6/12 max-w-[438px] mt-7'>
              <div className='text-center font-bold  flex flex-col items-center'>
                <div className='inline-flex gap-x-1.5 items-center'>
                  <div className='w-4 h-4 rounded-full bg-giants-orange' />
                  Especies observadas en {region === 'Región Amazonía' ? 'la región Amazonía' : region}
                </div>
                <div className='inline-flex gap-x-1.5 items-center'>
                  <div className='w-4 h-4 rounded-full bg-majorelle-blue' />
                  Especies observadas en {parentlabel || 'Colombia'}
                </div>
              </div>
              {/* <img className='mx-auto mt-4 w-11/12' src={'/' + chart_url} alt={title} /> */}
              <WaffleChart data={data} />
            </div>
          </div>
        </div>
      </div>)
  }

  if (layout === 'text-blocks') {
    if (texts.length >= 3) {
      return (
        <div className="px-5">
          <div className='grid md:grid-cols-2 lg:grid-cols-12 gap-10'>
            <div className='lg:col-start-1 lg:col-end-6 lg:row-start-1 lg:row-end-4'>
              <div className='bg-blue-green text-white min-h-full px-[71px] py-[145px]'>
                <p>
                  <b>Charalá</b>, patrimonio histórico de Colombia y de su Biodiversidad, es el municipio de Santander donde se han observado el mayor número de especies endémicas de Colombia.</p>
              </div>
            </div>
            <div className='hidden lg:block lg:col-start-6 lg:col-end-8 lg:row-start-1 lg:row-end-4'>
              <img className='w-full h-full object-cover object-center' src="/images/gallery-1.png" alt="gallery-1" />
            </div>
            <div className='lg:col-start-8 lg:col-end-13 lg:row-start-1 lg:row-end-2'>
              <div className='bg-blue-green text-white pt-[37px] pb-[34px] px-[108px]'>
                <p>
                  El 11% de las especies únicas del país que <b>viven en Santander</b> corren el riesgo de desaparecer. Usted puede cuidarlas!
                </p>
              </div>
            </div>
            <div className='hidden lg:block lg:col-start-8 lg:col-end-13 lg:row-start-2 lg:row-end-4'>
              <img className='w-full h-full object-cover object-center' src="/images/gallery-2.png" alt="gallery-2" />
            </div>
            <div className='hidden lg:block lg:lg:col-start-1 lg:col-end-8 lg:row-start-4 lg:row-end-5'>
              <img className='w-full h-full object-cover object-center' src="/images/gallery-3.png" alt="gallery-3" />
            </div>
            <div className='lg:col-start-8 lg:col-end-13 lg:row-start-4 lg:row-end-5'>
              <div className='bg-blue-green text-white pt-[37px] pb-[34px] px-[108px]'>
                <p>
                  <b>El roble colombiano</b>, árbol endémico de los Andes, es la planta con más observaciones en el departamento.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    } if (texts.length >= 2) {
      return (
        <div className='px-5 py-16'>
          <div className='space-y-5 flex flex-col justify-center items-center'>
            <img className='w-20 h-20' src='/images/quotes.png' />
            <h2 className='text-3xl font-bold text-dartmouth-green'>Destacados</h2>
          </div>
          <div className='flex flex-col lg:flex-row justify-center items-center gap-6 lg:gap-28 px-4 lg:px-10'>
            <div className='lg:col-start-1 lg:col-end-6'>
              <div className='h-full py-4 lg:py-10 px-4 lg:px-12'>
                <ListRender texts={texts[0]} />
              </div>
            </div>
            <div className='border-b-2 lg:border-b-0 lg:border-r-2 border-b/40 w-44 lg:w-auto lg:h-44' />
            <div className='lg:col-start-8 lg:col-end-13'>
              <div className='h-full py-4 lg:py-10 px-4 lg:px-12'>
                <ListRender texts={texts[1]} />
              </div>
            </div>
          </div>
        </div>
      )
    } else {
      return (
        <div className='px-5 py-16'>
          <div className='space-y-5 flex flex-col justify-center items-center'>
            <img className='w-20 h-20' src='/images/quotes.png' />
            <h2 className='text-3xl font-bold text-dartmouth-green'>Destacados</h2>
          </div>
          <div className='flex flex-col justify-center items-center'>
            <div className='h-full py-10 px-12'>
              <ListRender texts={texts[0]} />
            </div>
          </div>
        </div>
      )
    }
  }

  if (layout === 'title/(chart|chart)') {
    return (
      <div className="px-5">
        <div >
          <h2 className='text-black-2 font-black text-center text-2xl 3xl:text-4xl'>
            {title}
          </h2>
          <div className='lg:py-14'>
            <div className=''>
              <GraphsTopMun data={data} region={region} />
              {/* <iframe type="html" className="h-[410px] w-full" src={'/' + chart1_url} ></iframe>
              <iframe type="html" className="h-[410px] w-full" src={'/' + chart2_url} ></iframe> */}
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default Slides
