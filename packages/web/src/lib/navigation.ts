/**
 * Navigation data — port of sib-colombia/lib/navigation.js
 */

interface NavRegion {
  label: string;
  href: string;
}

interface NavSubsection {
  label: string;
  children?: NavRegion[];
}

export interface NavItem {
  label: string;
  href: string;
  color?: string;
  icon?: string;
  childs?: NavSubsection[];
}

export const navigationData: NavItem[] = [
  {
    label: "Colombia",
    href: "/colombia",
  },
  {
    color: "dartmouth-green",
    label: "Regiones",
    href: "",
    childs: [
      {
        label: "Departamentos",
        children: [
          { label: "Amazonas", href: "/amazonas" },
          { label: "Antioquia", href: "/antioquia" },
          { label: "Arauca", href: "/arauca" },
          { label: "Atlántico", href: "/atlantico" },
          { label: "Bogotá D. C.", href: "/bogota-dc" },
          { label: "Bolívar", href: "/bolivar" },
          { label: "Boyacá", href: "/boyaca" },
          { label: "Caldas", href: "/caldas" },
          { label: "Caquetá", href: "/caqueta" },
          { label: "Casanare", href: "/casanare" },
          { label: "Cauca", href: "/cauca" },
          { label: "Cesar", href: "/cesar" },
          { label: "Chocó", href: "/choco" },
          { label: "Córdoba", href: "/cordoba" },
          { label: "Cundinamarca", href: "/cundinamarca" },
          { label: "Guainía", href: "/guainia" },
          { label: "Guaviare", href: "/guaviare" },
          { label: "Huila", href: "/huila" },
          { label: "La Guajira", href: "/la-guajira" },
          { label: "Magdalena", href: "/magdalena" },
          { label: "Meta", href: "/meta" },
          { label: "Nariño", href: "/narino" },
          { label: "Norte de Santander", href: "/norte-santander" },
          { label: "Putumayo", href: "/putumayo" },
          { label: "Quindío", href: "/quindio" },
          { label: "Risaralda", href: "/risaralda" },
          { label: "San Andrés y Providencia", href: "/san-andres-providencia" },
          { label: "Santander", href: "/santander" },
          { label: "Sucre", href: "/sucre" },
          { label: "Tolima", href: "/tolima" },
          { label: "Valle del Cauca", href: "/valle-del-cauca" },
          { label: "Vaupés", href: "/vaupes" },
          { label: "Vichada", href: "/vichada" },
        ],
      },
      {
        label: "Áreas protegidas",
        children: [
          { label: "La Planada", href: "/especial/reserva-forestal-la-planada" },
        ],
      },
      {
        label: "Territorios indígenas",
        children: [
          // Prod canonicalizes /narino/resguardo-... → /especial/resguardo-...,
          // so link directly to the canonical path. The Region.tsx route
          // ("/especial/:slug") renders the same content as Municipality.tsx
          // would for the legacy nested path.
          { label: "Pialapí Pueblo Viejo", href: "/especial/resguardo-indigena-pialapi-pueblo-viejo" },
        ],
      },
      {
        label: "Regiones Naturales",
        children: [
          { label: "Región Amazonía", href: "/especial/region-amazonia" },
          { label: "Andina", href: "#" },
          { label: "Caribe", href: "#" },
          { label: "Insular", href: "#" },
          { label: "Orinoquía", href: "#" },
          { label: "Pacífico", href: "#" },
        ],
      },
      {
        // The 22 Núcleos de Desarrollo Forestal y de la Biodiversidad
        // (subtipo NDFyB). Listed independently like Departamentos — the
        // aggregate parent /nucleos-dfyb resolves directly but isn't linked
        // here (mirrors "no 'all departamentos' view"). Labels drop the
        // redundant "NDFyB " prefix the subsection header already conveys.
        label: "Núcleos de Desarrollo Forestal",
        children: [
          { label: "Agua Bonita", href: "/nucleos-dfyb-agua-bonita" },
          { label: "Angoleta", href: "/nucleos-dfyb-angoleta" },
          { label: "Camuya", href: "/nucleos-dfyb-camuya" },
          { label: "Charras", href: "/nucleos-dfyb-charras" },
          { label: "Chuapal - Manavires", href: "/nucleos-dfyb-chuapal-manavires" },
          { label: "Ciudad Yarí", href: "/nucleos-dfyb-ciudad-yari" },
          { label: "Cuemaní", href: "/nucleos-dfyb-cuemani" },
          { label: "Cueva del Jaguar", href: "/nucleos-dfyb-cueva-del-jaguar" },
          { label: "Kuway-Nueva York-La Cristalina", href: "/nucleos-dfyb-kuway-nueva-york-la-cristalina" },
          { label: "Las Perlas", href: "/nucleos-dfyb-las-perlas" },
          { label: "Llanos del Yarí - Yaguará II", href: "/nucleos-dfyb-llanos-del-yari-yaguara-ii" },
          { label: "Los Puertos", href: "/nucleos-dfyb-los-puertos" },
          { label: "Mapiripán", href: "/nucleos-dfyb-mapiripan" },
          { label: "Mecaya", href: "/nucleos-dfyb-mecaya" },
          { label: "Miraflores", href: "/nucleos-dfyb-miraflores" },
          { label: "Nueva Ilusión", href: "/nucleos-dfyb-nueva-ilusion" },
          { label: "Orotuyo", href: "/nucleos-dfyb-orotuyo" },
          { label: "Paraíso Amazónico", href: "/nucleos-dfyb-paraiso-amazonico" },
          { label: "PNN Sierra de la Macarena", href: "/nucleos-dfyb-pnn-sierra-de-la-macarena" },
          { label: "PNN Tinigua", href: "/nucleos-dfyb-pnn-tinigua" },
          { label: "Solano", href: "/nucleos-dfyb-solano" },
          { label: "Villa Catalina", href: "/nucleos-dfyb-villa-catalina" },
        ],
      },
    ],
  },
  {
    label: "Explorador",
    href: "/explorador",
  },
  {
    color: "flame",
    label: "Más",
    href: "",
    childs: [
      { label: "Acerca de", children: [{ label: "Acerca de", href: "/mas/acerca-de" }] },
      { label: "Glosario", children: [{ label: "Glosario", href: "/mas/glosario" }] },
      { label: "Metodología", children: [{ label: "Metodología", href: "/mas/metodologia" }] },
      { label: "Prensa", children: [{ label: "Prensa", href: "/mas/prensa" }] },
      { label: "Preguntas frecuentes", children: [{ label: "Preguntas frecuentes", href: "/mas/preguntas-frecuentes" }] },
      { label: "Publicadores", children: [{ label: "Publicadores", href: "/mas/publicadores" }] },
    ],
  },
];

export interface RegionDropdownItem {
  label: string;
  value: string;
  category?: string;
}

export function getRegionsForDropdown(): RegionDropdownItem[] {
  const regions: RegionDropdownItem[] = [
    { label: "Colombia", value: "colombia" },
  ];
  const regionsSection = navigationData.find((i) => i.label === "Regiones");
  if (regionsSection?.childs) {
    for (const cat of regionsSection.childs) {
      for (const r of cat.children ?? []) {
        const slug = r.href.split("/").pop();
        if (slug && slug !== "#") {
          regions.push({
            label: r.label,
            value: slug,
            category: cat.label,
          });
        }
      }
    }
  }
  return regions;
}
