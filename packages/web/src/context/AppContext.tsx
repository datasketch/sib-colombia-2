import { createContext, useContext, useState, type ReactNode } from "react";

interface BreadCrumbItem {
  label: string;
  href?: string;
}

interface AppContextValue {
  footerBgColor: string;
  setFooterBgColor: (c: string) => void;
  breadCrumb: BreadCrumbItem[];
  setBreadCrumb: (b: BreadCrumbItem[]) => void;
}

// Export both `AppContext` (for legacy components) and via useApp()
export const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [footerBgColor, setFooterBgColor] = useState("bg-footer-green");
  const [breadCrumb, setBreadCrumb] = useState<BreadCrumbItem[]>([]);

  return (
    <AppContext.Provider value={{ footerBgColor, setFooterBgColor, breadCrumb, setBreadCrumb }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
