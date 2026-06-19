interface Props {
  title: string;
  /** Slug for banner background: acerca-de, glosario, metodologia, etc. */
  slug?: string;
  /**
   * Optional intro paragraph rendered inside the banner column,
   * separated from the title by a thin white rule. Mirrors the
   * legacy `<HeadMore content description=… />` shape.
   */
  description?: string;
}

const VALID_BANNERS = [
  "acerca-de",
  "glosario",
  "metodologia",
  "preguntas-frecuentes",
  "prensa",
  "publicadores",
  "regiones",
];

export function HeadMore({ title, slug, description }: Props) {
  const bannerSlug = slug && VALID_BANNERS.includes(slug) ? slug : "mas";
  const bannerClass = `bg-banner-${bannerSlug}`;

  return (
    <div
      className={`${bannerClass} bg-cover bg-center h-80 pt-20 flex items-center text-white`}
    >
      <div className="w-4/5 lg:w-2/5 mx-auto text-center space-y-2">
        <span className="text-4xl lg:text-5xl font-black font-inter">
          {title}
        </span>
        {description && (
          <>
            <div className="border-b border-white w-4/5 lg:w-2/3 mx-auto" />
            <p className="font-lato text-sm">{description}</p>
          </>
        )}
      </div>
    </div>
  );
}
