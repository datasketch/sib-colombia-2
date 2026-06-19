import type { SpeciesListItem } from "../../api/types";
import { formatNumber } from "../../lib/format";

interface Props {
  species: SpeciesListItem[];
  title?: string;
}

export function SpeciesTable({ species, title }: Props) {
  if (!species || species.length === 0) {
    return <p className="text-sm italic text-gray-500">Sin especies para mostrar.</p>;
  }

  return (
    <div>
      {title && (
        <h4 className="font-semibold text-dartmouth-green mb-2">{title}</h4>
      )}
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b border-gray-200">
            <th className="py-2">Especie</th>
            <th className="py-2 text-right">Observaciones</th>
            <th className="py-2 text-right">Perfil</th>
          </tr>
        </thead>
        <tbody>
          {species.slice(0, 10).map((s, i) => (
            <tr key={i} className="border-b border-gray-100">
              <td className="py-2 italic">{s.label}</td>
              <td className="py-2 text-right">{formatNumber(s.registros)}</td>
              <td className="py-2 text-right space-x-2">
                {s.url_gbif && (
                  <a
                    href={s.url_gbif}
                    target="_blank"
                    rel="noreferrer"
                    className="text-lemon hover:underline"
                  >
                    GBIF
                  </a>
                )}
                {s.url_cbc && (
                  <a
                    href={s.url_cbc}
                    target="_blank"
                    rel="noreferrer"
                    className="text-lemon hover:underline"
                  >
                    CBC
                  </a>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
