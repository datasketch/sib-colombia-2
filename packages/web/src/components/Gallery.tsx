import type { GalleryItem } from "../api/types";

interface Props {
  items: GalleryItem[];
}

export function Gallery({ items }: Props) {
  if (!items || items.length === 0) return null;

  return (
    <section className="mb-12">
      <h2 className="font-barlow-condensed text-3xl text-dartmouth-green mb-6">
        Datos relevantes
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item, i) => (
          <div key={i} className="bg-white rounded-lg shadow-default overflow-hidden">
            {item.image && (
              <div className="relative aspect-video bg-gray-100">
                <img
                  src={item.image}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {item.credit && (
                  <div className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-2 py-1 rounded">
                    📷 {item.credit}
                  </div>
                )}
              </div>
            )}
            <p className="p-4 text-sm text-gray-700">{item.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
