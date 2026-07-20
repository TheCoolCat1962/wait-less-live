import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Settings as SettingsIcon,
  ChevronRight,
  Moon,
  Bell,
  MapPin,
  Shield,
  LogOut,
  Loader2,
  Trash2,
  Download,
  HelpCircle,
  Info,
  ChevronDown,
} from "lucide-react";
import { AppShell } from "@/components/queueless/AppShell";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

type SettingSection = {
  title: string;
  items: SettingItem[];
};

type SettingItem = {
  id: string;
  label: string;
  description?: string;
  icon: typeof Bell;
  type: "toggle" | "navigation" | "action" | "danger";
  value?: boolean;
  href?: string;
};

const sections: SettingSection[] = [
  {
    title: "Appearance",
    items: [
      {
        id: "dark_mode",
        label: "Dark mode",
        description: "Use dark theme throughout the app",
        icon: Moon,
        type: "toggle",
        value: false,
      },
    ],
  },
  {
    title: "Notifications",
    items: [
      {
        id: "push_notifications",
        label: "Push notifications",
        description: "Receive alerts about wait times and updates",
        icon: Bell,
        type: "toggle",
        value: true,
      },
      {
        id: "email_notifications",
        label: "Email digest",
        description: "Weekly summary of your favorite places",
        icon: Bell,
        type: "toggle",
        value: false,
      },
    ],
  },
  {
    title: "Location",
    items: [
      {
        id: "location_accuracy",
        label: "High accuracy mode",
        description: "Use GPS for more precise nearby results",
        icon: MapPin,
        type: "toggle",
        value: true,
      },
    ],
  },
  {
    title: "Privacy & Security",
    items: [
      {
        id: "manage_account",
        label: "Manage account",
        description: "Update email, password, and security settings",
        icon: Shield,
        type: "navigation",
        href: "/settings/account",
      },
      {
        id: "privacy",
        label: "Privacy settings",
        description: "Control your data and visibility",
        icon: Shield,
        type: "navigation",
        href: "/settings/privacy",
      },
    ],
  },
];

function SettingsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<Record<string, boolean>>({
    dark_mode: false,
    push_notifications: true,
    email_notifications: false,
    location_accuracy: true,
  });
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSetting = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSignOut = async () => {
    if (!confirm("Are you sure you want to sign out?")) return;
    setLoading(true);
    try {
      // Simulate sign out
      await new Promise((resolve) => setTimeout(resolve, 500));
      navigate({ to: "/profile" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    alert(
      "To delete your account, please contact support@queueless.app with your request. Account deletion is processed within 30 days."
    );
  };

  return (
    <AppShell>
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-surface/90 px-5 py-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-2xl bg-surface-muted text-muted-foreground">
            <SettingsIcon className="size-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Preferences
            </p>
            <h1 className="text-xl font-extrabold tracking-tight">Settings</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="px-5 py-4">
        <div className="space-y-6">
          {sections.map((section) => (
            <div key={section.title}>
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {section.title}
              </p>
              <div className="space-y-1 rounded-2xl border border-border bg-surface">
                {section.items.map((item, index) => {
                  const Icon = item.icon;
                  const isLast = index === section.items.length - 1;
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 px-4 py-3.5 ${
                        !isLast ? "border-b border-border" : ""
                      }`}
                    >
                      <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-muted text-muted-foreground">
                        <Icon className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{item.label}</p>
                        {item.description && (
                          <p className="text-xs text-muted-foreground">
                            {item.description}
                          </p>
                        )}
                      </div>
                      {item.type === "toggle" && (
                        <button
                          onClick={() => toggleSetting(item.id)}
                          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                            settings[item.id]
                              ? "bg-brand"
                              : "bg-surface-muted"
                          }`}
                        >
                          <span
                            className={`absolute top-1 size-4 rounded-full bg-white shadow transition-transform ${
                              settings[item.id] ? "right-1" : "left-1"
                            }`}
                          />
                        </button>
                      )}
                      {item.type === "navigation" && (
                        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Expandable Sections */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              More options
            </p>
            <div className="space-y-1 rounded-2xl border border-border bg-surface">
              <button
                onClick={() =>
                  setExpandedSection(
                    expandedSection === "region" ? null : "region"
                  )
                }
                className="flex w-full items-center gap-3 px-4 py-3.5"
              >
                <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-muted text-muted-foreground">
                  <MapPin className="size-4" />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-sm font-semibold">Region</p>
                  <p className="text-xs text-muted-foreground">
                    New Orleans Metro
                  </p>
                </div>
                <ChevronDown
                  className={`size-4 shrink-0 text-muted-foreground transition-transform ${
                    expandedSection === "region" ? "rotate-180" : ""
                  }`}
                />
              </button>
              {expandedSection === "region" && (
                <div className="border-t border-border px-4 py-3">
                  <p className="text-xs text-muted-foreground">
                    QueueLess is currently available in the New Orleans metro
                    area. We're expanding to more cities soon!
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Data Management */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Data
            </p>
            <div className="space-y-1 rounded-2xl border border-border bg-surface">
              <button
                onClick={() => alert("Export feature coming soon!")}
                className="flex w-full items-center gap-3 px-4 py-3.5"
              >
                <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-muted text-muted-foreground">
                  <Download className="size-4" />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-sm font-semibold">Export data</p>
                  <p className="text-xs text-muted-foreground">
                    Download your reports and activity
                  </p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex w-full items-center gap-3 px-4 py-3.5"
              >
                <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-danger/10 text-danger">
                  <Trash2 className="size-4" />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-sm font-semibold text-danger">
                    Delete account
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Permanently remove your data
                  </p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Support */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Support
            </p>
            <div className="space-y-1 rounded-2xl border border-border bg-surface">
              <button
                onClick={() => alert("Help center coming soon!")}
                className="flex w-full items-center gap-3 px-4 py-3.5"
              >
                <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-muted text-muted-foreground">
                  <HelpCircle className="size-4" />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-sm font-semibold">Help center</p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </button>
              <button
                onClick={() => alert("About QueueLess v1.0.0")}
                className="flex w-full items-center gap-3 px-4 py-3.5"
              >
                <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-muted text-muted-foreground">
                  <Info className="size-4" />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-sm font-semibold">About QueueLess</p>
                  <p className="text-xs text-muted-foreground">Version 1.0.0</p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-4 py-3.5 font-semibold text-danger transition-colors hover:bg-danger/5 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Signing out…
              </>
            ) : (
              <>
                <LogOut className="size-4" />
                Sign out
              </>
            )}
          </button>
        </div>
      </main>
    </AppShell>
  );
}
