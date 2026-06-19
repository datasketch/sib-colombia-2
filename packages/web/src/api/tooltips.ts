import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "./client";

interface TooltipRow {
  slug: string;
  tooltip: string | null;
}

export function useTooltips() {
  return useQuery({
    queryKey: ["tooltips"],
    queryFn: async () => {
      const rows = await fetchApi<TooltipRow[]>("/info/tooltips");
      const map = new Map<string, string>();
      for (const row of rows) {
        if (row.tooltip) map.set(row.slug, row.tooltip);
      }
      return map;
    },
    staleTime: Infinity, // tooltips don't change
  });
}
