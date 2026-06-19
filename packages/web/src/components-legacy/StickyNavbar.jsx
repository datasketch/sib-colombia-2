import { useState, useEffect } from 'react'

const StickyNavbar = ({ generalInfo, slug, municipalityflag }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [activeSection, setActiveSection] = useState('')

  useEffect(() => {
    const handleScroll = () => {
      // Show sticky footer after scrolling past the banner (approximately 550px)
      const scrollPosition = window.scrollY
      setIsVisible(scrollPosition > 550)

      // Determine which section is currently active
      const sections = ['tematicas', 'grupos-biologicos', 'grupos-interes', 'territorio', 'publicadores', 'mapa', 'explorador']
      let currentSection = ''

      for (const sectionId of sections) {
        const element = document.getElementById(sectionId)
        if (element) {
          const rect = element.getBoundingClientRect()
          const offset = 100 // Account for sticky navbar height

          if (rect.top <= offset && rect.bottom > offset) {
            currentSection = sectionId
            break
          }
        }
      }

      setActiveSection(currentSection)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      const offset = 80 // Account for sticky footer height
      const elementPosition = element.offsetTop - offset
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      })
    }
  }

  // Check if sections actually exist on the page
  const sectionExists = (sectionId) => {
    return document.getElementById(sectionId) !== null
  }

  // Define sections based on what's available in the page
  const sections = [
    {
      id: 'tematicas',
      label: 'Temáticas',
      condition: true // Will be conditionally rendered in PageComponent
    },
    {
      id: 'grupos-biologicos',
      label: 'Grupos Biológicos',
      condition: true // Always show
    },
    {
      id: 'grupos-interes',
      label: 'Grupos de Interés',
      condition: true // Will be conditionally rendered in PageComponent
    },
    {
      id: 'territorio',
      label: generalInfo?.label === 'Colombia' ? 'Departamentos' : (slug === 'region-amazonia' ? 'Región' : 'Municipios'),
      condition: true // Will be conditionally rendered in PageComponent
    },
    {
      id: 'publicadores',
      label: 'Publicadores',
      condition: true // Always show
    },
    {
      id: 'explorador',
      label: 'Explora',
      condition: slug !== 'region-amazonia' // Don't show for region-amazonia
    }
  ]

  if (!isVisible) return null

  return (
    <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="mx-auto w-10/12 max-w-screen-2xl">
        <div className="flex items-center justify-between py-3">
          {/* Region Name and Logo */}
          <div
            className="flex flex-col items-center space-y-1 cursor-pointer hover:opacity-80 transition-opacity duration-200"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <img
              className="h-6 w-auto"
              style={{ filter: 'grayscale(100%) brightness(0.6)' }}
              src="/images/logo-biodiversidadcifras.svg"
              alt="Logo biodiversidadcifras"
            />
            <span className="text-base font-bold text-gray-800">
              {generalInfo?.label}
            </span>
          </div>

          {/* Back to Top Button - Top Right */}
          <div className="absolute top-2 right-0">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center space-x-1 text-xs text-gray-600 hover:text-dartmouth-green transition-colors duration-200 px-2 py-1 cursor-pointer"
            >
              <span>Volver arriba</span>
              <svg className="w-3 h-3 rotate-180" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-6 overflow-x-auto">
            {sections.map((section) => {
              if (!section.condition || !sectionExists(section.id)) return null

              const isActive = activeSection === section.id
              return (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`flex-shrink-0 px-3 py-2 text-sm font-medium transition-colors duration-200 whitespace-nowrap relative cursor-pointer ${
                    isActive
                      ? 'text-dartmouth-green'
                      : 'text-gray-700 hover:text-dartmouth-green hover:bg-gray-50'
                  }`}
                >
                  {section.label}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-dartmouth-green"></div>
                  )}
                </button>
              )
            })}
          </nav>
        </div>
      </div>
    </div>
  )
}

export default StickyNavbar
