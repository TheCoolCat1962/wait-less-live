import { memo, type ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { ReportSheet } from "./ReportSheet";

export const AppShell = memo(function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="relative mx-auto min-h-screen w-full max-w-[430px] bg-background pb-28">
        {children}
      </div>
      <BottomNav />
      <ReportSheet />
    </>
  );
});
