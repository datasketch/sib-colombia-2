import { useEffect, useState } from "react";
import { useExploradorStore } from "../../store";
import { ChartError, ChartLoading } from "./ChartState";

/**
 * Locator map for leaf / special regions that have no choropleth of their
 * own: the region highlighted in context (a municipio inside its
 * department, a department/núcleo/reserva inside Colombia). Served as a
 * pre-rendered SVG by `GET /api/locator/<slug>.svg` (cartography's
 * silhouette pipeline). A 404 surfaces as a visible error — no fallback,
 * per the project rule.
 */
export function LocatorMap() {
  const region = useExploradorStore((s) => s.region);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [nonce, setNonce] = useState(0);

  useEffect(() => setStatus("loading"), [region]);

  if (!region) return null;

  return (
    <div className="relative h-full w-full flex items-center justify-center rounded overflow-hidden border border-gray-200 bg-white p-2">
      {status === "error" ? (
        <ChartError
          message={`No se pudo cargar el localizador de ${region}`}
          onRetry={() => {
            setStatus("loading");
            setNonce((n) => n + 1);
          }}
        />
      ) : (
        <>
          {status === "loading" && <div className="absolute inset-0"><ChartLoading /></div>}
          <img
            key={`${region}-${nonce}`}
            src={`/api/locator/${region}.svg${nonce ? `?r=${nonce}` : ""}`}
            alt={`Ubicación de ${region}`}
            // The SVG has a small intrinsic size; fill the chart area
            // (object-contain keeps the aspect ratio while scaling it up).
            className="h-full w-full object-contain"
            onLoad={() => setStatus("ready")}
            onError={() => setStatus("error")}
          />
        </>
      )}
    </div>
  );
}
