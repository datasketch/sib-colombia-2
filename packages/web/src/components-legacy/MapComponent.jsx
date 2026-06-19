import { useState } from 'react'
import { selectColorRanking } from './lib/functions'
import Map from './Map'
import CardRank from './CardRank'

const MapComponent = ({ data }) => {
  const [hoveredCountry, setHoveredCountry] = useState({ name: '', position: '' })

  const colorSelector = (name, filter) => {
    const contain = filter?.find(c => c['..gt_name'] === name)
    return selectColorRanking(contain?.puesto)
  }

  const mouseEnterHandler = (name) => {
    const selectedCountry = data.country_ranking.find(c => c['..gt_name'] === name)
    if (selectedCountry === undefined) return setHoveredCountry({ pais: '', position: '', categorie: '' })
    setHoveredCountry({ pais: selectedCountry?.pais, position: selectedCountry?.puesto })
  }

  return (
    <div className='flex flex-col gap-4 md:gap-10 h-full w-full mt-6 -mb-6 md:-mb-16'>
      <section className='flex flex-col lg:flex-row'>
        <div className='lg:w-1/3 mt-10 flex flex-col gap-3'>
          {data?.positions.map((pos) =>
            <CardRank key={'cr' + pos.position} info={pos} refs={data.position_refs}/>
          )}

        </div>
        <div className='w-full lg:w-2/3 mt-10 lg:mt-16'>
          <Map {...{ colorSelector, mouseEnterHandler, hoveredCountry, setHoveredCountry, details: data.country_ranking/*,  categories: details?.title */ }} />
        </div>
      </section>

    </div>

  )
}

export default MapComponent
