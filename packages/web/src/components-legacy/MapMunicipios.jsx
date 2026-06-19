import { useState, useEffect, useRef } from 'react'
import * as d3Geo from 'd3-geo'
import { MapContainer, GeoJSON, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import * as d3Scale from 'd3-scale'

const MapMunicipios = ({ data, isScale = false, slug, municipios = [] }) => {
  const [selectedMunicipality, setSelectedMunicipality] = useState(null)
  const [hoveredMunicipality, setHoveredMunicipality] = useState(null)
  const [mapType, setMapType] = useState('species') // 'species' or 'observations'
  const [searchTerm, setSearchTerm] = useState('')
  const mapRef = useRef()
  const mapLayers = useRef(new Map())
  const municipalityListRef = useRef()
  const municipalityRefs = useRef(new Map())

  // Helper function to create popup content
  const createPopupContent = (feature) => {
    const value = mapType === 'species' ? (feature.properties.n_especies || 0) : (feature.properties.n_registros || 0)
    const label = mapType === 'species' ? 'especies' : 'observaciones'
    const mun = municipios.find(m => m.label === feature.properties.label)
    const linkHtml = mun ? `<div class="mt-2"><a href="/${slug}/${mun.slug}" target="_blank" class="text-green-600 hover:text-green-800 text-sm font-medium">Ver más →</a></div>` : ''

    return `
      <div class="p-3">
        <h3 class="font-bold text-lg mb-2">${feature.properties.label}</h3>
        <div class="space-y-2">
          <div>
            <span class="text-sm text-gray-600">${label}:</span>
            <span class="font-semibold ml-1">${value.toLocaleString()}</span>
          </div>
          ${linkHtml}
        </div>
      </div>
    `
  }

  // Helper function to scroll to municipality in left panel
  const scrollToMunicipality = (feature) => {
    const featureId = feature.properties.cod_dane || feature.properties.id || feature.properties.label
    const municipalityElement = municipalityRefs.current.get(featureId)

    if (municipalityElement && municipalityListRef.current) {
      municipalityElement.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      })
    }
  }

  // Helper function to show popup for a feature
  const showPopupForFeature = (feature) => {
    const layerId = feature.properties.cod_dane || feature.properties.id || feature.properties.label
    const layer = mapLayers.current.get(layerId)
    if (layer && mapRef.current) {
      // Close any existing popups
      mapRef.current.closePopup()

      // Create and show popup
      const popupContent = createPopupContent(feature)
      layer.bindPopup(popupContent, {
        closeButton: false,
        className: 'custom-popup'
      }).openPopup()

      // Center map on the feature
      if (feature.geometry && feature.geometry.coordinates) {
        const centroid = d3Geo.geoCentroid(feature)
        // d3Geo.geoCentroid returns [longitude, latitude], Leaflet expects [latitude, longitude]
        // Also handle potential coordinate system issues
        const lat = centroid[1]
        const lng = centroid[0]

        // If coordinates seem to be in wrong hemisphere, don't transform
        // Colombia is roughly between 12°N to -4°S latitude and -66°W to -84°W longitude
        if (lat >= -10 && lat <= 15 && lng >= -90 && lng <= -60) {
          mapRef.current.setView([lat, lng], mapRef.current.getZoom())
        }
      }
    }
  }

  useEffect(() => {
    if (data && data.features && data.features.length > 0) {
      // Set first municipality as default selected
      setSelectedMunicipality(data.features[0])
    }
  }, [data])

  // Add CSS to prevent focus outlines and style tooltips
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      .leaflet-interactive:focus {
        outline: none !important;
      }
      .leaflet-interactive:focus-visible {
        outline: none !important;
      }
      .leaflet-interactive {
        outline: none !important;
      }
      .municipality-tooltip {
        background: white !important;
        border: 1px solid #e5e7eb !important;
        border-radius: 4px !important;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1) !important;
        color: #374151 !important;
        font-size: 12px !important;
        font-weight: 500 !important;
        padding: 4px 8px !important;
      }
      .municipality-tooltip:before {
        border-top-color: white !important;
      }
    `
    document.head.appendChild(style)

    return () => {
      document.head.removeChild(style)
    }
  }, [])

  // Additional effect to handle map size invalidation on mount (simplified)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize()
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [])

  if (!data || !data.features) {
    return <div className="flex justify-center items-center h-96">Cargando mapa...</div>
  }

  // Calculate centroid for map center (same approach as MapRegionAmazonia)
  const centroid = d3Geo.geoCentroid(data)
  const center = centroid.map((coord, index) => {
    if (index === 0) return coord - 180
    return coord * -1
  }).reverse()

  // Calculate dynamic zoom based on geographic extent
  const calculateZoom = () => {
    let minLat = Infinity
    let maxLat = -Infinity
    let minLng = Infinity
    let maxLng = -Infinity

    data.features.forEach(feature => {
      if (feature.geometry && feature.geometry.coordinates) {
        const coords = feature.geometry.coordinates

        const processCoords = (coordArray) => {
          if (typeof coordArray[0] === 'number') {
            const [lng, lat] = coordArray
            if (lat < minLat) minLat = lat
            if (lat > maxLat) maxLat = lat
            if (lng < minLng) minLng = lng
            if (lng > maxLng) maxLng = lng
          } else {
            coordArray.forEach(processCoords)
          }
        }

        processCoords(coords)
      }
    })

    // Calculate the span of the data
    const latSpan = maxLat - minLat
    const lngSpan = maxLng - minLng
    const maxSpan = Math.max(latSpan, lngSpan)

    // Dynamic zoom based on geographic extent
    if (maxSpan > 4) return 7 // Very large departments
    if (maxSpan > 2) return 8 // Large departments
    if (maxSpan > 1) return 9 // Medium departments
    if (maxSpan > 0.5) return 10 // Small departments
    return 11 // Very small departments
  }

  const dynamicZoom = calculateZoom()

  // Color scale for data visualization
  const features = data.features
  const dataValues = features.map(f => mapType === 'species' ? (f.properties?.n_especies || 0) : (f.properties?.n_registros || 0))
  const maximum = Math.max(...dataValues, 1)
  const minimum = Math.min(...dataValues, 0)

  const colorScale = d3Scale.scaleLinear()
    .domain([minimum, maximum])
    .range(['#B6ECBF', '#29567D'])

  // Handle feature interactions
  const handleEachFeature = (feature, layer) => {
    // Store layer reference for programmatic access
    const layerId = feature.properties.cod_dane || feature.properties.id || feature.properties.label
    mapLayers.current.set(layerId, layer)

    const properties = feature.properties
    const currentValue = mapType === 'species' ? (properties?.n_especies || 0) : (properties?.n_registros || 0)

    layer.setStyle({
      fillColor: currentValue > 0 ? colorScale(currentValue) : '#F5F4F6',
      fillOpacity: 0.6,
      color: '#333',
      weight: 1,
      opacity: 0.8,
      interactive: true,
      bubblingMouseEvents: false
    })

    // Event handlers
    layer.on({
      click: (e) => {
        setSelectedMunicipality(feature)

        // Prevent default behavior and stop propagation
        e.originalEvent.preventDefault()
        e.originalEvent.stopPropagation()

        // Scroll to municipality in left panel
        scrollToMunicipality(feature)

        // Create and show popup
        const popupContent = createPopupContent(feature)
        layer.bindPopup(popupContent, {
          closeButton: false,
          className: 'custom-popup'
        }).openPopup()

        // Remove any focus/selection effects
        if (layer._path) {
          layer._path.style.outline = 'none'
          layer._path.blur()
        }
      },
      mouseover: (e) => {
        setHoveredMunicipality(feature)
        layer.setStyle({
          fillOpacity: 0.8,
          weight: 2
        })

        // Create and show tooltip
        layer.bindTooltip(feature.properties.label, {
          permanent: false,
          direction: 'top',
          className: 'municipality-tooltip',
          opacity: 0.9
        }).openTooltip()
      },
      mouseout: (e) => {
        setHoveredMunicipality(null)
        layer.setStyle({
          fillColor: currentValue > 0 ? colorScale(currentValue) : '#F5F4F6',
          fillOpacity: 0.6,
          weight: 1
        })

        // Close tooltip
        layer.closeTooltip()
      }
    })
  }

  // Calculate total values for the department
  const totalSpecies = features.reduce((sum, f) => sum + (f.properties?.n_especies || 0), 0)
  const totalRecords = features.reduce((sum, f) => sum + (f.properties?.n_registros || 0), 0)

  return (
    <div className="w-full bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Main Content */}
      <div className="flex flex-col md:flex-row md:h-[600px]">
        {/* Left Panel - Municipality List */}
        <div className="w-full md:w-1/3 p-4 md:p-6 bg-gray-50">
          <div className="h-full flex flex-col">
            <div className="mb-6">
              <p className="text-gray-700 text-sm leading-relaxed">
                Selecciona un municipio para ver sus cifras de biodiversidad y explorar su información detallada.
              </p>
            </div>

            {/* Municipality List */}
            <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Municipios
                </h3>
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Buscar municipio..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div ref={municipalityListRef} className="space-y-2 overflow-y-auto max-h-96">
                  {data.features
                    .slice()
                    .sort((a, b) => a.properties.label.localeCompare(b.properties.label))
                    .filter(feature =>
                      searchTerm === '' ||
                      feature.properties.label.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((feature) => {
                      const featureId = feature.properties.cod_dane || feature.properties.id || feature.properties.label
                      const selectedId = selectedMunicipality?.properties?.cod_dane || selectedMunicipality?.properties?.id || selectedMunicipality?.properties?.label
                      const hoveredId = hoveredMunicipality?.properties?.cod_dane || hoveredMunicipality?.properties?.id || hoveredMunicipality?.properties?.label

                      const isSelected = selectedMunicipality && selectedId === featureId
                      const isHovered = hoveredMunicipality && hoveredId === featureId

                      return (
                      <div
                        key={feature.properties.cod_dane || feature.properties.id || feature.properties.label}
                        ref={(el) => {
                          if (el) {
                            municipalityRefs.current.set(featureId, el)
                          }
                        }}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          isHovered
                            ? 'bg-blue-100 border border-blue-300'
                            : isSelected
                            ? 'bg-green-100 border border-green-300'
                            : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                        }`}
                        onClick={() => {
                          setSelectedMunicipality(feature)
                          // Show popup on the map
                          setTimeout(() => {
                            showPopupForFeature(feature)
                          }, 100)
                        }}
                        onMouseEnter={() => {
                          setHoveredMunicipality(feature)
                          // Trigger map layer hover effect
                          const layerId = feature.properties.cod_dane || feature.properties.id || feature.properties.label
                          const layer = mapLayers.current.get(layerId)
                          if (layer) {
                            layer.setStyle({
                              fillOpacity: 0.8,
                              weight: 2
                            })
                          }
                        }}
                        onMouseLeave={() => {
                          setHoveredMunicipality(null)
                          // Reset map layer style
                          const layerId = feature.properties.cod_dane || feature.properties.id || feature.properties.label
                          const layer = mapLayers.current.get(layerId)
                          if (layer) {
                            const currentValue = mapType === 'species' ? (feature.properties?.n_especies || 0) : (feature.properties?.n_registros || 0)
                            layer.setStyle({
                              fillColor: currentValue > 0 ? colorScale(currentValue) : '#F5F4F6',
                              fillOpacity: 0.6,
                              weight: 1
                            })
                          }
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-800">
                              {feature.properties.label}
                            </h4>
                            {(() => {
                              const mun = municipios.find(m => m.label === feature.properties.label)
                              return mun
                                ? (
                                  <a
                                    href={`/${slug}/${mun.slug}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center gap-1"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    Ver más
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                  </a>
                                  )
                                : null
                            })()}
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-gray-800">
                              {mapType === 'species'
                                ? (feature.properties.n_especies || 0).toLocaleString()
                                : (feature.properties.n_registros || 0).toLocaleString()
                              }
                            </div>
                            <div className="text-xs text-gray-500">
                              {mapType === 'species' ? 'especies' : 'registros'}
                            </div>
                          </div>
                        </div>
                      </div>
                      )
                    })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Map */}
        <div className="w-full md:w-2/3 relative bg-white h-[400px] md:h-auto">
          {/* Map Type Selector */}
          <div className="absolute top-4 right-4 z-20">
            <div className="flex rounded-md shadow-sm bg-white p-1">
              <button
                onClick={() => setMapType('species')}
                className={`px-3 py-1 text-sm font-medium rounded-l-md border cursor-pointer ${
                  mapType === 'species'
                    ? 'bg-dartmouth-green text-white border-dartmouth-green'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Especies
              </button>
              <button
                onClick={() => setMapType('observations')}
                className={`px-3 py-1 text-sm font-medium rounded-r-md border-t border-r border-b cursor-pointer ${
                  mapType === 'observations'
                    ? 'bg-dartmouth-green text-white border-dartmouth-green'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Observaciones
              </button>
            </div>
          </div>

          <MapContainer
            ref={mapRef}
            center={center}
            zoom={dynamicZoom}
            minZoom={6}
            maxZoom={14}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%', zIndex: 1, backgroundColor: 'white' }}
            zoomControl={true}
            attributionControl={false}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              subdomains="abcd"
              maxZoom={20}
            />
            <GeoJSON
              key={`${mapType}-${JSON.stringify(data)}`}
              data={data}
              onEachFeature={handleEachFeature}
            />
          </MapContainer>

          {/* Data Card Overlay */}
          {selectedMunicipality && (
            <div className="absolute top-16 left-4 bg-white p-4 rounded-lg shadow-lg max-w-xs border border-gray-200">
              <h3 className="font-bold text-lg mb-3 text-gray-800">
                {selectedMunicipality.properties.label}
              </h3>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">Especies</span>
                    <span className="text-sm font-semibold text-gray-800">
                      {selectedMunicipality.properties.n_especies?.toLocaleString() || 0}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{
                        width: `${((selectedMunicipality.properties.n_especies || 0) / Math.max(...data.features.map(f => f.properties.n_especies || 0))) * 100}%`
                      }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {(((selectedMunicipality.properties.n_especies || 0) / totalSpecies) * 100).toFixed(1)}% del total
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">Registros</span>
                    <span className="text-sm font-semibold text-gray-800">
                      {selectedMunicipality.properties.n_registros?.toLocaleString() || 0}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{
                        width: `${((selectedMunicipality.properties.n_registros || 0) / Math.max(...data.features.map(f => f.properties.n_registros || 0))) * 100}%`
                      }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {(((selectedMunicipality.properties.n_registros || 0) / totalRecords) * 100).toFixed(1)}% del total
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="absolute bottom-4 right-4 z-30 bg-white p-4 rounded-lg shadow-lg border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-800 mb-2">
              {mapType === 'species' ? 'Especies' : 'Observaciones'}
            </h4>
            <div className="space-y-2">
              {/* Color gradient bar */}
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-600 min-w-[30px]">{minimum.toLocaleString()}</span>
                                <div
                  className="h-4 w-24 rounded"
                  style={{
                    background: 'linear-gradient(to right, #B6ECBF, #29567D)'
                  }}
                ></div>
                <span className="text-xs text-gray-600 min-w-[30px]">{maximum.toLocaleString()}</span>
              </div>
              {/* No data indicator */}
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#F5F4F6' }}></div>
                <span className="text-xs text-gray-600">Sin datos</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MapMunicipios
