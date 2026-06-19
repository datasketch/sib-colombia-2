import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as TooltipPieChart, Legend } from "recharts";
import { formatNumber } from "../lib/format";

const COLORS = [
  "#5151F2", "#00AFFF", "#4AD3AC", "#F26330",
  "#FFD150", "#FFE0BB", "#163875", "#161B33",
];

interface PublishersTipo {
  tipo_organizacion: string;
  n_tipo: number;
  n_tipo_obs: number;
  pct_tipo: number;
  pct_tipo_obs: number;
}

interface PublishersList {
  slug_publicador: string;
  label: string;
  registros: number;
  especies: number;
  tipo_publicador: string | null;
  pais_publicacion: string | null;
  url_logo: string | null;
  url_socio: string | null;
}

interface Props {
  publicadoresList: PublishersList[];
  publicadoresTipo: PublishersTipo[];
}

/**
 * Publishers section: total card + 2 pie charts
 * Port of InfoPublishers.jsx
 */
export function InfoPublishers({ publicadoresList, publicadoresTipo }: Props) {
  const totalPublishers = publicadoresList.length;

  const internationalEntry = publicadoresTipo.find(
    (t) => t.tipo_organizacion === "Internacional"
  );
  const nInternational = internationalEntry?.n_tipo ?? 0;
  const nNational = publicadoresTipo
    .filter((t) => t.tipo_organizacion !== "Internacional")
    .reduce((sum, t) => sum + t.n_tipo, 0);

  const infoRegion = publicadoresTipo.map((t) => ({
    name: t.tipo_organizacion,
    value: t.pct_tipo * 100,
    label: t.n_tipo,
  }));

  const infoRemark = publicadoresTipo.map((t) => ({
    name: t.tipo_organizacion,
    value: t.pct_tipo_obs * 100,
    label: t.n_tipo_obs,
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Total card */}
      <div className="bg-white shadow-default p-6">
        <h2 className="text-xl font-bold text-black/80">Total de publicadores</h2>
        <div className="mt-6 space-y-6 text-center">
          <div className="bg-gray-2 py-3">
            <p className="font-black text-4xl">{nNational}</p>
            <p className="text-lg">Nacionales</p>
          </div>
          <div className="py-3">
            <p className="font-black text-4xl">{nInternational}</p>
            <p className="text-lg">Internacionales</p>
          </div>
          <div className="bg-gray-2 px-3 py-2 text-right">
            <h3 className="text-base italic">Total: {totalPublishers}</h3>
          </div>
        </div>
      </div>

      {/* Publishers by type pie */}
      <div className="bg-white shadow-default p-4 min-h-[300px]">
        <h2 className="text-base font-bold text-black/80 mb-3">
          Publicadores por tipo de organización
        </h2>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={infoRegion}
              cx="35%"
              cy="50%"
              labelLine={false}
              outerRadius={70}
              fill="#8884d8"
              dataKey="value"
            >
              {infoRegion.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <TooltipPieChart content={<TooltipPublishers />} />
            <Legend
              iconSize={9}
              iconType="circle"
              layout="vertical"
              verticalAlign="middle"
              align="right"
              wrapperStyle={{ fontSize: "11px", lineHeight: "18px" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Observations by org type pie */}
      <div className="bg-white shadow-default p-4 min-h-[300px]">
        <h2 className="text-base font-bold text-black/80 mb-3">
          Observaciones aportadas por tipo de organización
        </h2>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={infoRemark}
              cx="35%"
              cy="50%"
              labelLine={false}
              outerRadius={70}
              fill="#8884d8"
              dataKey="value"
            >
              {infoRemark.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <TooltipPieChart content={<TooltipObservations />} />
            <Legend
              iconSize={9}
              iconType="circle"
              layout="vertical"
              verticalAlign="middle"
              align="right"
              wrapperStyle={{ fontSize: "11px", lineHeight: "18px" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

interface TooltipPayload {
  active?: boolean;
  payload?: Array<{ payload: { name: string; label: number }; value: number }>;
}

function TooltipPublishers({ active, payload }: TooltipPayload) {
  if (!active || !payload?.length) return null;
  const { name, label } = payload[0].payload;
  const value = payload[0].value;
  return (
    <div className="bg-white p-2 rounded shadow-lg text-xs">
      <p className="font-semibold italic">
        Tipo de organización:{" "}
        <span className="font-normal not-italic">{name}</span>
      </p>
      <p className="font-semibold italic">
        Cantidad de publicadores:{" "}
        <span className="font-normal not-italic">
          {formatNumber(label)} ({value.toFixed(0)}%)
        </span>
      </p>
    </div>
  );
}

function TooltipObservations({ active, payload }: TooltipPayload) {
  if (!active || !payload?.length) return null;
  const { name, label } = payload[0].payload;
  const value = payload[0].value;
  return (
    <div className="bg-white p-2 rounded shadow-lg text-xs">
      <p className="font-semibold italic">
        Tipo de organización:{" "}
        <span className="font-normal not-italic">{name}</span>
      </p>
      <p className="font-semibold italic">
        Cantidad de observaciones:{" "}
        <span className="font-normal not-italic">
          {formatNumber(label)} ({value.toFixed(0)}%)
        </span>
      </p>
    </div>
  );
}
