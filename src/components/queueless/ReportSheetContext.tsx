import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

interface ReportSheetContext {
  isOpen: boolean;
  businessId: string | null;
  open: (businessId?: string) => void;
  close: () => void;
}

const Ctx = createContext<ReportSheetContext | null>(null);

export function ReportSheetProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);

  const open = useCallback((id?: string) => {
    setBusinessId(id ?? null);
    setIsOpen(true);
  }, []);
  const close = useCallback(() => setIsOpen(false), []);

  const value = useMemo(
    () => ({ isOpen, businessId, open, close }),
    [isOpen, businessId, open, close],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useReportSheet() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useReportSheet must be used inside ReportSheetProvider");
  return ctx;
}
