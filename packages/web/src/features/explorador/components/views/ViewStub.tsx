interface Props {
  name: string;
  message?: string;
}

export function ViewStub({ name, message }: Props) {
  return (
    <div className="flex items-center justify-center h-full w-full border-2 border-dashed border-gray-300 rounded bg-gray-50 text-gray-500 text-sm">
      <div className="text-center">
        <div className="font-medium">Vista: {name}</div>
        {message && <div className="mt-1 text-xs">{message}</div>}
      </div>
    </div>
  );
}
