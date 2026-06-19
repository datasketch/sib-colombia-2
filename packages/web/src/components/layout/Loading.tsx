export function Loading({ label = "Cargando..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-16 text-dartmouth-green">
      <div className="animate-pulse">{label}</div>
    </div>
  );
}

interface ErrorBoxProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorBox({ message, onRetry }: ErrorBoxProps) {
  return (
    <div className="max-w-3xl mx-auto p-6 my-8 bg-white border border-red-200 rounded-xl shadow-sm">
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="text-red-500 text-2xl leading-none">!</span>
        <div className="flex-1">
          <h3 className="font-inter font-bold text-base text-red-800 mb-1">
            No se pudieron cargar los datos
          </h3>
          <p className="text-sm font-lato text-gray-700">{message}</p>
        </div>
      </div>
      {onRetry && (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onRetry}
            className="bg-flame text-white font-inter font-bold text-sm px-5 py-2 rounded-full hover:bg-flame/90 cursor-pointer flex items-center gap-2"
          >
            <img src="/images/icon-reset-white.svg" alt="" className="h-4 w-4" />
            Reintentar
          </button>
        </div>
      )}
    </div>
  );
}
