import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Search, Star, User, Plus } from "lucide-react";
import { useReportSheet } from "./ReportSheetContext";

function NavItem({
  to,
  icon: Icon,
  label,
  active,
}: {
  to: string;
  icon: typeof Home;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={`flex flex-col items-center gap-1 py-1 ${active ? "text-brand" : "text-foreground/60"}`}
    >
      <Icon className="size-5" strokeWidth={active ? 2.5 : 2} />
      <span className="text-[10px] font-bold uppercase tracking-wider">
        {label}
      </span>
    </Link>
  );
}

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { open } = useReportSheet();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-[430px] items-center justify-between border-t border-border bg-surface/95 px-6 pb-6 pt-3 backdrop-blur">
      <NavItem to="/" icon={Home} label="Home" active={pathname === "/"} />
      <NavItem
        to="/search"
        icon={Search}
        label="Search"
        active={pathname.startsWith("/search")}
      />
      <button
        type="button"
        onClick={() => open()}
        aria-label="Report wait time"
        className="-mt-10 grid size-14 place-items-center rounded-2xl border-4 border-background bg-brand text-brand-foreground shadow-lg shadow-brand/40 transition-transform active:scale-95"
      >
        <Plus className="size-6" strokeWidth={3} />
      </button>
      <NavItem
        to="/favorites"
        icon={Star}
        label="Saved"
        active={pathname.startsWith("/favorites")}
      />
      <NavItem
        to="/profile"
        icon={User}
        label="Profile"
        active={pathname.startsWith("/profile")}
      />
    </nav>
  );
}
