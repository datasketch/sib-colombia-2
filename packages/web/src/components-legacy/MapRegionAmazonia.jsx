import { useState, useEffect, useRef } from 'react'
import * as d3Geo from 'd3-geo'
import { MapContainer, GeoJSON, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import * as d3Scale from 'd3-scale'

const MapRegionAmazonia = () => {
  const [geoJsonData, setGeoJsonData] = useState(null)
  const [departamentosData, setDepartamentosData] = useState(null)
  const [municipiosData, setMunicipiosData] = useState(null)
  const [selectedDepartment, setSelectedDepartment] = useState(null)
  const [hoveredDepartment, setHoveredDepartment] = useState(null)
  const mapLayers = useRef(new Map())

  // Department data with external links (sorted alphabetically)
  const departments = [
    { id: '91', name: 'Amazonas', slug: 'amazonas' },
    { id: '18', name: 'Caquetá', slug: 'caqueta' },
    { id: '19', name: 'Cauca', slug: 'cauca' },
    { id: '94', name: 'Guainía', slug: 'guainia' },
    { id: '95', name: 'Guaviare', slug: 'guaviare' },
    { id: '50', name: 'Meta', slug: 'meta' },
    { id: '86', name: 'Putumayo', slug: 'putumayo' },
    { id: '97', name: 'Vaupés', slug: 'vaupes' }
  ]

  useEffect(() => {
    // Fetch + JSON-parse a static asset, returning null on failure.
    // Vite's SPA fallback returns 200 + text/html for missing files,
    // so `response.ok` is true but `.json()` throws — wrap each
    // fetch independently so a missing optional layer doesn't block
    // the primary geojson + the default-selected dept.
    const fetchJson = async (url) => {
      try {
        const r = await fetch(url)
        if (!r.ok) return null
        const ct = r.headers.get('content-type') || ''
        if (!/json/i.test(ct)) return null
        return await r.json()
      } catch (e) {
        return null
      }
    }

    const loadGeoJsonData = async () => {
      const data = await fetchJson('/data/region-amazonia/region-amazonia.geojson')
      if (!data || !Array.isArray(data.features)) {
        console.error('Failed to load region-amazonia geojson')
        return
      }
      setGeoJsonData(data)

      // Optional layers — if missing, the map still renders without
      // the dept-background polygons / muni overlays.
      const departamentosData = await fetchJson('/data/region-amazonia/region-amazonia-departamentos.geojson')
      if (departamentosData) setDepartamentosData(departamentosData)

      const municipiosData = await fetchJson('/data/region-amazonia/region-amazonia-municipios.json')
      if (municipiosData) setMunicipiosData(municipiosData)

      // Auto-select Amazonas (cod_dane 91) so the left-side info
      // panel renders on first load instead of the "Selecciona un
      // departamento" placeholder. Match prod behaviour.
      const amazonas = data.features.find(f => String(f.properties.cod_dane) === '91')
      if (amazonas) {
        setSelectedDepartment(amazonas)
      }
    }

    loadGeoJsonData()
  }, [])

  if (!geoJsonData) {
    return <div className="flex justify-center items-center h-96">Cargando mapa...</div>
  }

  // Calculate centroid for map center
  const centroid = d3Geo.geoCentroid(geoJsonData)
  const center = centroid.map((coord, index) => {
    if (index === 0) return coord - 180
    return coord * -1
  }).reverse()

  // Color scale for data visualization
  const features = geoJsonData.features
  const dataValues = features.map(f => f.properties?.especies_region_total || 0)
  const maximum = Math.max(...dataValues, 1)
  const minimum = Math.min(...dataValues, 0)

  const colorScale = d3Scale.scaleLinear()
    .domain([minimum, maximum])
    .range(['#B6ECBF', '#29567D'])

  // Handle departamentos background layer styling
  const handleDepartamentosFeature = (feature, layer) => {
    layer.setStyle({
      fillColor: '#F5F4F6',
      fillOpacity: 0.5,
      color: '#9CA3AF', // gray-400
      weight: 2,
      opacity: 0.8
    })

    // Disable interactions for background layer and set lower z-index
    layer.off()
    layer.setStyle({ ...layer.options, interactive: false })
    if (layer._path) {
      layer._path.style.pointerEvents = 'none'
    }
  }

  // Handle feature interactions
  const handleEachFeature = (feature, layer) => {
    // Store layer reference for programmatic access (use useRef to avoid state updates during render)
    mapLayers.current.set(feature.properties.cod_dane, layer)

    const properties = feature.properties
    const currentValue = properties?.especies_region_total || 0

    layer.setStyle({
      fillColor: currentValue > 0 ? colorScale(currentValue) : '#F5F4F6',
      fillOpacity: 0.6,
      color: '#333',
      weight: 1,
      opacity: 0.8,
      interactive: true
    })

    // Ensure this layer is interactive and on top
    if (layer._path) {
      layer._path.style.pointerEvents = 'auto'
      layer._path.style.zIndex = '1000'
    }

    // Event handlers
    layer.on({
      click: () => {
        setSelectedDepartment(feature)

        // Create popup content
        const popupContent = `
          <div class="p-3">
            <h3 class="font-bold text-lg mb-2">${feature.properties.label}</h3>
            <div class="space-y-2">
              <div>
                <span class="text-sm text-gray-600">Especies aportadas:</span>
                <span class="font-semibold ml-1">${(feature.properties.aporte_especies_region || 0).toLocaleString()}</span>
                <div class="text-xs text-gray-500">${feature.properties.pct_aporte_especies_region ? (feature.properties.pct_aporte_especies_region * 100).toFixed(0) + '%' : '0%'} del total</div>
              </div>
              <div>
                <span class="text-sm text-gray-600">Observaciones aportadas:</span>
                <span class="font-semibold ml-1">${(feature.properties.aporte_registros_region || 0).toLocaleString()}</span>
                <div class="text-xs text-gray-500">${feature.properties.pct_aporte_registros_region ? (feature.properties.pct_aporte_registros_region * 100).toFixed(0) + '%' : '0%'} del total</div>
              </div>
            </div>
          </div>
        `

        layer.bindPopup(popupContent, {
          closeButton: false,
          className: 'custom-popup'
        }).openPopup()
      },
      mouseover: (e) => {
        setHoveredDepartment(feature)
        layer.setStyle({
          fillOpacity: 0.8,
          weight: 2
        })
      },
      mouseout: (e) => {
        setHoveredDepartment(null)
        layer.setStyle({
          fillColor: currentValue > 0 ? colorScale(currentValue) : '#F5F4F6',
          fillOpacity: 0.6,
          weight: 1
        })
      }
    })
  }

  // Calculate total values for the region
  const totalSpecies = features.reduce((sum, f) => sum + (f.properties?.especies_region_total || 0), 0)
  const totalRecords = features.reduce((sum, f) => sum + (f.properties?.registros_region_total || 0), 0)

  // Get department info for selected department
  const getDepartmentInfo = (feature) => {
    if (!feature) return null
    const dept = departments.find(d => d.id === feature.properties.cod_dane)
    return dept
  }

  return (
    <div className="w-full bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Main Content */}
      <div className="flex h-[600px]">
        {/* Left Panel - Region Information */}
        <div className="w-1/3 p-6 bg-gray-50">
          <div className="h-full flex flex-col">
            <div className="mb-6">
              <p className="text-gray-700 text-sm leading-relaxed">
                El polígono que delimita la Amazonía cubre solo una parte de algunos departamentos, por lo que su aporte de datos a la región corresponde únicamente a esa fracción y puede diferir de su contribución total a nivel nacional.
              </p>
            </div>

            <div className="mb-4">
              <p className="text-gray-800 text-sm font-medium">
                Conoce el aporte de cada departamento al conocimiento de la biodiversidad en la Amazonía.
              </p>
            </div>

            {/* Department Information */}
            {selectedDepartment && (
              <div className="flex-1 bg-white p-4 rounded-lg shadow-sm border border-gray-200 overflow-y-auto">
                <div className="mb-4">
                  <h4 className="text-md font-medium text-gray-700 mb-3">Información general</h4>

                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-600">Departamento:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800">
                        {selectedDepartment.properties.label}
                      </span>
                      {getDepartmentInfo(selectedDepartment) && (
                        <a
                          href={`/${getDepartmentInfo(selectedDepartment).slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-800 text-sm font-medium"
                        >
                          Ver más →
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h5 className="font-semibold text-gray-800 mb-2 text-sm">Aporte de Especies</h5>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Aporte de especies:</span>
                        <span className="font-medium text-gray-800">
                          {selectedDepartment.properties.aporte_especies_region?.toLocaleString() || 0}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">% de especies aportadas:</span>
                        <span className="font-medium text-gray-800">
                          {selectedDepartment.properties.pct_aporte_especies_region ? `${(selectedDepartment.properties.pct_aporte_especies_region * 100).toFixed(0)}%` : '0%'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-semibold text-gray-800 mb-2 text-sm">Aporte de observaciones</h5>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Aporte de observaciones:</span>
                        <span className="font-medium text-gray-800">
                          {selectedDepartment.properties.aporte_registros_region?.toLocaleString() || 0}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">% de observaciones aportadas:</span>
                        <span className="font-medium text-gray-800">
                          {selectedDepartment.properties.pct_aporte_registros_region ? `${(selectedDepartment.properties.pct_aporte_registros_region * 100).toFixed(0)}%` : '0%'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!selectedDepartment && (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-gray-500 text-center">
                  Selecciona un departamento en el mapa para ver su información
                </p>
              </div>
            )}
          </div>
        </div>

                {/* Center Panel - Map */}
        <div className="w-1/2 relative bg-white">
          <MapContainer
            center={center}
            zoom={6}
            scrollWheelZoom={false}
            style={{ height: '100%', width: '100%', zIndex: 1 }}
            zoomControl={false}
            attributionControl={false}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              subdomains="abcd"
              maxZoom={20}
            />
            {/* Background departamentos layer */}
            {departamentosData && (
              <GeoJSON
                key="departamentos-layer"
                data={departamentosData}
                onEachFeature={handleDepartamentosFeature}
                style={{ zIndex: 1 }}
              />
            )}
            {/* Main region data layer */}
            <GeoJSON
              key="main-region-layer"
              data={geoJsonData}
              onEachFeature={handleEachFeature}
              style={{ zIndex: 1000 }}
            />
          </MapContainer>

          {/* Data Card Overlay */}
          {selectedDepartment && (
            <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-lg max-w-xs border border-gray-200">
              <h3 className="font-bold text-lg mb-3 text-gray-800">
                {selectedDepartment.properties.label}
              </h3>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">Especies</span>
                    <span className="text-sm font-semibold text-gray-800">
                      {selectedDepartment.properties.especies_region_total?.toLocaleString() || 0}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{
                        width: `${((selectedDepartment.properties.especies_region_total || 0) / maximum) * 100}%`
                      }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {(((selectedDepartment.properties.especies_region_total || 0) / totalSpecies) * 100).toFixed(1)}% del total
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">Observaciones</span>
                    <span className="text-sm font-semibold text-gray-800">
                      {selectedDepartment.properties.registros_region_total?.toLocaleString() || 0}
                </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{
                        width: `${((selectedDepartment.properties.registros_region_total || 0) / totalRecords) * 100}%`
                      }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {(((selectedDepartment.properties.registros_region_total || 0) / totalRecords) * 100).toFixed(1)}% del total
                  </div>
                </div>
              </div>
            </div>
          )}

                                        {/* Source Attribution */}
          <div className="absolute bottom-2 left-2 right-2 text-xs z-10">
            <div className="text-gray-400 text-center">
              <div className="leading-tight">
                <span className="font-medium">Mapa región amazonía colombiana. Fuente:</span> <a
                  href="https://www.dnp.gov.co/plan-nacional-desarrollo/pnd-2022-2026"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-gray-700 underline inline-flex items-center gap-1"
                >
                  Departamento Nacional de Planeación
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"></path>
                    <path d="M5 5a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2v-2a1 1 0 10-2 0v2H5V7h2a1 1 0 000-2H5z"></path>
                  </svg>
                </a><br/>
                Plan Nacional de Desarrollo 2022–2026: Colombia, Potencia Mundial de la Vida.
              </div>
            </div>
          </div>
        </div>

        {/* Right Navigation Panel - Departments and Municipalities */}
        <div className="w-1/6 p-3 bg-gray-50 border-l border-gray-200">
          <div className="h-full overflow-y-auto">
            <h3 className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
              Navega en la biodiversidad
            </h3>

            {/* Departments List */}
            <div className="space-y-1 mb-4">
              {departments.map((dept) => {
                const isHovered = hoveredDepartment?.properties.cod_dane === dept.id
                const isSelected = selectedDepartment?.properties.cod_dane === dept.id
                const regionFeature = geoJsonData?.features.find(f => f.properties.cod_dane === dept.id)

                return (
                  <div
                    key={dept.id}
                    className={`flex items-center gap-2 p-1.5 rounded transition-colors ${
                      isHovered
                        ? 'bg-blue-50 border-l-2 border-blue-400'
                        : isSelected
                          ? 'bg-green-50 border-l-2 border-green-400'
                          : 'hover:bg-gray-100'
                    }`}
                    onMouseEnter={() => {
                      if (regionFeature) {
                        setHoveredDepartment(regionFeature)
                      }
                    }}
                    onMouseLeave={() => {
                      setHoveredDepartment(null)
                    }}
                  >
                    <div className={`w-2 h-2 rounded-full ${
                      isSelected ? 'bg-green-400' : 'bg-gray-400'
                    }`}></div>
                    <span
                      className={`text-xs flex-1 cursor-pointer hover:underline ${
                        isHovered
                          ? 'font-medium text-blue-700'
                          : isSelected
                            ? 'font-medium text-green-700'
                            : 'text-gray-600'
                      }`}
                      onClick={() => {
                        if (regionFeature) {
                          setSelectedDepartment(regionFeature)

                          // Trigger popup using stored layer reference
                          const layer = mapLayers.current.get(dept.id)
                          if (layer && typeof layer.fire === 'function') {
                            // Simply fire the click event on the layer
                            layer.fire('click')
                          }
                        }
                      }}
                    >
                      {dept.name}
                    </span>
                    <a
                      href={`/${dept.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"></path>
                        <path d="M5 5a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2v-2a1 1 0 10-2 0v2H5V7h2a1 1 0 000-2H5z"></path>
                      </svg>
                    </a>
                  </div>
                )
              })}
            </div>

            {/* Municipalities List */}
            {(hoveredDepartment || selectedDepartment) && municipiosData && (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                  <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  {(hoveredDepartment || selectedDepartment)?.properties.label}
                </h4>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {municipiosData[(hoveredDepartment || selectedDepartment)?.properties.cod_dane]
                    ?.sort((a, b) => a.label.localeCompare(b.label))
                    ?.map((municipio) => {
                      const deptSlug = departments.find(d => d.id === (hoveredDepartment || selectedDepartment)?.properties.cod_dane)?.slug
                      return (
                        <div
                          key={municipio.slug}
                          className="flex items-center gap-1 p-1 pl-4 rounded hover:bg-gray-100"
                        >
                          <svg className="w-1.5 h-1.5 fill-current text-gray-400" viewBox="0 0 8 8">
                            <circle cx="4" cy="4" r="2" />
                          </svg>
                          <span
                            className="text-xs text-gray-600 hover:text-gray-800 hover:underline flex-1 cursor-pointer"
                            onClick={() => {
                              // For now, just log - municipalities don't have map polygons to show popups
                              // console.log('Municipality clicked:', municipio.label)
                            }}
                          >
                            {municipio.label}
                          </span>
                          <a
                            href={`/${deptSlug}/${municipio.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-300 hover:text-gray-500"
                          >
                            <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"></path>
                              <path d="M5 5a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2v-2a1 1 0 10-2 0v2H5V7h2a1 1 0 000-2H5z"></path>
                            </svg>
                          </a>
                        </div>
                      )
                    })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MapRegionAmazonia
