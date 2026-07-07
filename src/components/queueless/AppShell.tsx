import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { ReportSheet } from "./ReportSheet";
import { ReportSheetProvider } from "./ReportSheetContext";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <ReportSheetProvider>
      <div className="relative mx-auto min-h-screen w-full max-w-[430px] bg-background pb-28">
        {children}
      </div>
      <BottomNav />
      <ReportSheet />
    </ReportSheetProvider>
  );
}
