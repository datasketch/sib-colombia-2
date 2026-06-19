export function ChartLoading() {
  return (
    <div className="flex items-center justify-center h-full w-full text-gray-500 text-sm">
      Cargando…
    </div>
  );
}

interface ChartErrorProps {
  message?: string;
  onRetry?: () => void;
}

export function ChartError({ message, onRetry }: ChartErrorProps = {}) {
  return (
    <div className="flex items-center justify-center h-full w-full p-4">
      <div className="border border-red-200 bg-red-50 text-red-800 p-3 rounded max-w-2xl w-full">
        <div className="font-semibold mb-1">Error al cargar los datos</div>
        <div className="font-mono text-xs break-all whitespace-pre-wrap">
          {message ?? "Error desconocido"}
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 text-xs border border-red-300 text-red-800 rounded px-2 py-1 hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dartmouth-green"
          >
            Reintentar
          </button>
        )}
      </div>
    </div>
  );
}

export function ChartEmpty() {
  return (
    <div className="flex items-center justify-center h-full w-full">
      <div className="border border-[#4ad3ac] bg-[#F2FBF8] text-[#09A274] p-4 rounded-lg text-center max-w-md">
        <div className="font-semibold text-lg">Los filtros no arrojaron resultados</div>
        <div className="text-sm mt-1">Por favor amplía la búsqueda con categorías más genéricas</div>
      </div>
    </div>
  );
}
