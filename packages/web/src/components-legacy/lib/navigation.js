// Navigation data shared across components
export const navigationData = [
  {
    label: 'Colombia',
    href: '/colombia'
  },
  {
    color: 'dartmouth-green',
    label: 'Regiones',
    icon: '/images/arrow-green-icon.svg',
    href: '',
    childs: [
      {
        label: 'Departamentos',
        children: [
          {
            label: 'Amazonas',
            href: '/amazonas',
            isHighlighted: true
          },
          {
            label: 'Antioquia',
            href: '/antioquia'
          },
          {
            label: 'Arauca',
            href: '/arauca'
          },
          {
            label: 'Atlántico',
            href: '/atlantico'
          },
          {
            label: 'Bogotá D. C.',
            href: '/bogota-dc'
          },
          {
            label: 'Bolívar',
            href: '/bolivar'
          },
          {
            label: 'Boyacá',
            href: '/boyaca',
            isHighlighted: true
          },
          {
            label: 'Caldas',
            href: '/caldas'
          },
          {
            label: 'Caquetá',
            href: '/caqueta',
            isHighlighted: true
          },
          {
            label: 'Casanare',
            href: '/casanare'
          },
          {
            label: 'Cauca',
            href: '/cauca'
          },
          {
            label: 'Cesar',
            href: '/cesar'
          },
          {
            label: 'Chocó',
            href: '/choco'
          },
          {
            label: 'Córdoba',
            href: '/cordoba'
          },
          {
            label: 'Cundinamarca',
            href: '/cundinamarca'
          },
          {
            label: 'Guainía',
            href: '/guainia',
            isHighlighted: true
          },
          {
            label: 'Guaviare',
            href: '/guaviare',
            isHighlighted: true
          },
          {
            label: 'Huila',
            href: '/huila'
          },
          {
            label: 'La Guajira',
            href: '/la-guajira'
          },
          {
            label: 'Magdalena',
            href: '/magdalena'
          },
          {
            label: 'Meta',
            href: '/meta'
          },
          {
            label: 'Nariño',
            href: '/narino',
            isHighlighted: true
          },
          {
            label: 'Norte de Santander',
            href: '/norte-santander'
          },
          {
            label: 'Putumayo',
            href: '/putumayo',
            isHighlighted: true
          },
          {
            label: 'Quindío',
            href: '/quindio'
          },
          {
            label: 'Risaralda',
            href: '/risaralda'
          },
          {
            label: 'San Andrés y Providencia',
            href: '/san-andres-providencia'
          },
          {
            label: 'Santander',
            href: '/santander',
            isHighlighted: true
          },
          {
            label: 'Sucre',
            href: '/sucre'
          },
          {
            label: 'Tolima',
            href: '/tolima',
            isHighlighted: true
          },
          {
            label: 'Valle del Cauca',
            href: '/valle-del-cauca'
          },
          {
            label: 'Vaupés',
            href: '/vaupes',
            isHighlighted: true
          },
          {
            label: 'Vichada',
            href: '/vichada'
          }
        ]
      },
      {
        label: 'Áreas protegidas',
        children: [
          {
            label: 'La Planada',
            href: '/especial/reserva-forestal-la-planada'
          }
        ]
      },
      {
        label: 'Territorios indígenas',
        children: [
          {
            label: 'Pialapí Pueblo Viejo',
            href: '/narino/resguardo-indigena-pialapi-pueblo-viejo'
          }
        ]
      },
      {
        label: 'Regiones Naturales',
        children: [
          {
            label: 'Región Amazonía',
            href: '/especial/region-amazonia'
          },
          {
            label: 'Andina',
            href: '#'
          },
          {
            label: 'Caribe',
            href: '#'
          },
          {
            label: 'Insular',
            href: '#'
          },
          {
            label: 'Orinoquía',
            href: '#'
          },
          {
            label: 'Pacífico',
            href: '#'
          }
        ]
      }
    ]
  },
  {
    label: 'Explorador',
    href: '/explorador'
  },
  {
    color: 'flame',
    label: 'Más',
    href: '',
    childs: [
      {
        label: 'Acerca de',
        href: '/mas/acerca-de'
      },
      {
        label: 'Glosario',
        href: '/mas/glosario'
      },
      {
        label: 'Metodología',
        href: '/mas/metodologia'
      },
      {
        label: 'Prensa',
        href: '/mas/prensa'
      },
      {
        label: 'Preguntas frecuentes',
        href: '/mas/preguntas-frecuentes'
      },
      {
        label: 'Publicadores',
        href: '/mas/publicadores'
      }
    ]
  }
]

// Function to extract regions for dropdown (used in publicadores page)
export function getRegionsForDropdown () {
  const regions = []

  // Add Colombia
  regions.push({
    label: 'Colombia',
    value: 'colombia'
  })

  // Find the regions section
  const regionsSection = navigationData.find(item => item.label === 'Regiones')
  if (regionsSection && regionsSection.childs) {
    regionsSection.childs.forEach(category => {
      if (category.children) {
        category.children.forEach(region => {
          // Extract the slug from the href - get the last part after the last slash
          const slug = region.href.split('/').pop()
          if (slug && slug !== '#') {
            regions.push({
              label: region.label,
              value: slug,
              category: category.label,
              isHighlighted: region.isHighlighted
            })
          }
        })
      }
    })
  }

  return regions
}

// Function to get regions grouped by category
export function getRegionsGroupedByCategory () {
  const regions = []

  // Add Colombia
  regions.push({
    label: 'Colombia',
    value: 'colombia',
    category: 'General'
  })

  // Find the regions section
  const regionsSection = navigationData.find(item => item.label === 'Regiones')
  if (regionsSection && regionsSection.childs) {
    regionsSection.childs.forEach(category => {
      if (category.children) {
        category.children.forEach(region => {
          // Extract the slug from the href - get the last part after the last slash
          const slug = region.href.split('/').pop()
          if (slug && slug !== '#') {
            regions.push({
              label: region.label,
              value: slug,
              category: category.label,
              isHighlighted: region.isHighlighted
            })
          }
        })
      }
    })
  }

  return regions
}

// Function to get regions in grouped structure for dropdown
export function getRegionsForGroupedDropdown () {
  const groupedRegions = []

  // Add Colombia
  groupedRegions.push({
    label: 'Colombia',
    value: 'colombia',
    category: 'General'
  })

  // Find the regions section
  const regionsSection = navigationData.find(item => item.label === 'Regiones')
  if (regionsSection && regionsSection.childs) {
    regionsSection.childs.forEach(category => {
      const categoryRegions = []

      if (category.children) {
        category.children.forEach(region => {
          // Extract the slug from the href - get the last part after the last slash
          const slug = region.href.split('/').pop()
          if (slug && slug !== '#') {
            categoryRegions.push({
              label: region.label,
              value: slug,
              category: category.label,
              isHighlighted: region.isHighlighted
            })
          }
        })
      }

      if (categoryRegions.length > 0) {
        groupedRegions.push({
          category: category.label,
          regions: categoryRegions
        })
      }
    })
  }

  return groupedRegions
}
