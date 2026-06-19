import * as d3Geo from 'd3-geo'
import { MapContainer, GeoJSON } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const SmallMap = ({ data, isScale = false, slug }) => {
  const centroid = d3Geo.geoCentroid(data)
  const center = centroid.map((coord, index) => {
    if (index === 0) return coord - 180
    return coord * -1
  }).reverse()

  const geoJSONStyle = {
    fillColor: '#B3CFC0',
    color: '#B2CECF',
    weight: 0,
    opacity: 0,
    fillOpacity: 1
  }

  return (
    <>
      <div className='flex flex-row mt-10 px-7'>
        <div className='cursor-default'>
          <MapContainer center={center} zoom={['atlantico', 'bogota-dc', 'caldas', 'quindio', 'risaralda', 'san-andres-y-providencia'].includes(slug) ? (!isScale ? 3 : 8) : !isScale ? 3 : 6} scrollWheelZoom={false} style={{ height: 200, width: 300, background: 'transparent', position: 'sticky' }} zoomControl={false} attributionControl={false} dragging={false} doubleClickZoom={false}>
            <GeoJSON data={data} style={geoJSONStyle} />
          </MapContainer>
        </div>
        <div className='w-14 h-[123px]'>
          <img src='/images/mapa-co.svg' alt='mapa-co' />
        </div>
      </div>
    </>
  )

  /* const mapDataCoords = data.territorio ? data.territorio[0].map_data : []
  const geoJsonFormat = {
    type: 'FeatureCollection',
    features: mapDataCoords.reduce((prev, curr) => {
      return [
        ...prev,
        {
          type: 'Feature',
          geometry: curr.geometry,
          properties: {
            id: curr.id,
            name: curr.name,
            depto: curr.depto
          }
        }
      ]
    }, [])
  }
  const center = d3Geo.geoCentroid(geoJsonFormat)

  return (
    <div data-tip="" className=''>
      <ComposableMap
        style={{ width: '100%', height: '100%' }}
        projection="geoMercator"
        projectionConfig={{ center, scale: !isScale ? 2000 : 6000 }}
      >
        <Geographies geography={geoJsonFormat}>
          {({ geographies }) =>
            geographies.map((geo) => {
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={'#B3CFC0'}
                />
              )
            }
            )
          }
        </Geographies>
      </ComposableMap>
    </div>
  ) */
}

export default SmallMap
