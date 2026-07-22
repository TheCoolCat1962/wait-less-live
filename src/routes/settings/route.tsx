import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/queueless/AppShell";

export const Route = createFileRoute("/settings")({
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
