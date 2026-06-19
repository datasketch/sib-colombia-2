import { ComposableMap, Geographies, Geography } from 'react-simple-maps'
import mapJson from '../data/colombia-world-map.json'

const Map = ({ mouseEnterHandler, setHoveredCountry, hoveredCountry, colorSelector, details, categories }) => {
  return (
    <div className='relative'>
      <ComposableMap projection="geoEqualEarth">
        <Geographies geography={mapJson}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                stroke='#333333' strokeWidth={0.5}
                onMouseEnter={() => mouseEnterHandler(geo.properties.name)}
                onMouseLeave={() => setHoveredCountry({ pais: '', position: '' })}
                style={{
                  default: {
                    fill: colorSelector(geo.properties.name, details),
                    outline: 'none'
                  },
                  hover: {
                    fill: '#628bf8',
                    outline: 'none',
                    cursor: 'pointer'
                  },
                  pressed: { outline: 'none', fill: 'none' }
                }}
              />
            ))
          }
        </Geographies>
      </ComposableMap>

      {hoveredCountry?.pais && (
        <div className='absolute top-2 left-2 bg-white text-black text-xs p-2 rounded shadow-lg pointer-events-none font-lato'>
          <p className='font-black'>{hoveredCountry.pais}</p>
          {categories && <p>{categories}</p>}
          <p className='italic font-light'>Puesto {hoveredCountry.position}</p>
        </div>
      )}
    </div>
  )
}

export default Map
