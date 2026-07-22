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
  Download,
  HelpCircle,
  Info,
  ChevronDown,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useSettings } from "@/lib/settings";
import { useTheme } from "@/lib/theme";

export const Route = createFileRoute("/settings/")({
  component: SettingsPage,
});

function Toggle({
  enabled,
  onClick,
  disabled = false,
}: {
  enabled: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
        enabled ? "bg-brand" : "bg-surface-muted"
      }`}
    >
      <span
        className={`absolute top-1 size-4 rounded-full bg-white shadow transition-transform ${
          enabled ? "right-1" : "left-1"
        }`}
      />
    </button>
  );
}

function SettingsPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { settings, toggleSetting, syncing } = useSettings();
  const { isDark, toggle: toggleDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const handleSignOut = async () => {
    if (!confirm("Are you sure you want to sign out?")) return;
    setLoading(true);
    try {
      await signOut();
      console.log("[Settings] Sign out completed, navigating to profile");
      navigate({ to: "/profile" });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDark = () => {
    toggleDark();
  };

  return (
    <>
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
          {syncing && (
            <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="size-3 animate-spin" />
              Saving
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="px-5 py-4">
        <div className="space-y-6">
          {/* Appearance */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Appearance
            </p>
            <div className="space-y-1 rounded-2xl border border-border bg-surface">
              <div className="flex items-center gap-3 px-4 py-3.5">
                <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-muted text-muted-foreground">
                  <Moon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">Dark mode</p>
                  <p className="text-xs text-muted-foreground">Use dark theme throughout the app</p>
                </div>
                <Toggle enabled={isDark} onClick={handleToggleDark} />
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Notifications
            </p>
            <div className="space-y-1 rounded-2xl border border-border bg-surface">
              <div className="flex items-center gap-3 px-4 py-3.5">
                <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-muted text-muted-foreground">
                  <Bell className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">Push notifications</p>
                  <p className="text-xs text-muted-foreground">
                    Receive alerts about wait times and updates
                  </p>
                </div>
                <Toggle
                  enabled={settings.push_notifications}
                  onClick={() => toggleSetting("push_notifications")}
                />
              </div>
              <div className="flex items-center gap-3 border-t border-border px-4 py-3.5">
                <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-muted text-muted-foreground">
                  <Bell className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">Email digest</p>
                  <p className="text-xs text-muted-foreground">
                    Weekly summary of your favorite places
                  </p>
                </div>
                <Toggle
                  enabled={settings.email_notifications}
                  onClick={() => toggleSetting("email_notifications")}
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Location
            </p>
            <div className="space-y-1 rounded-2xl border border-border bg-surface">
              <div className="flex items-center gap-3 px-4 py-3.5">
                <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-muted text-muted-foreground">
                  <MapPin className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">High accuracy mode</p>
                  <p className="text-xs text-muted-foreground">
                    Use GPS for more precise nearby results
                  </p>
                </div>
                <Toggle
                  enabled={settings.location_accuracy}
                  onClick={() => toggleSetting("location_accuracy")}
                />
              </div>
            </div>
          </div>

          {/* Privacy & Security */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Account
            </p>
            <div className="space-y-1 rounded-2xl border border-border bg-surface">
              <Link to="/settings/account" className="flex items-center gap-3 px-4 py-3.5">
                <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-muted text-muted-foreground">
                  <Shield className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">Manage account</p>
                  <p className="text-xs text-muted-foreground">
                    Update email, password, and security
                  </p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
              <Link
                to="/settings/privacy"
                className="flex items-center gap-3 border-t border-border px-4 py-3.5"
              >
                <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-muted text-muted-foreground">
                  <Shield className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">Privacy settings</p>
                  <p className="text-xs text-muted-foreground">Control your data and visibility</p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            </div>
          </div>

          {/* Expandable Sections */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              More options
            </p>
            <div className="space-y-1 rounded-2xl border border-border bg-surface">
              <button
                onClick={() => setExpandedSection(expandedSection === "region" ? null : "region")}
                className="flex w-full items-center gap-3 px-4 py-3.5"
              >
                <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-muted text-muted-foreground">
                  <MapPin className="size-4" />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-sm font-semibold">Region</p>
                  <p className="text-xs text-muted-foreground">New Orleans Metro</p>
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
                    QueueLess is currently available in the New Orleans metro area. We're expanding
                    to more cities soon!
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
                onClick={() =>
                  alert(
                    "Data export feature coming soon! Your data will be exported as a JSON file.",
                  )
                }
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
                <span className="text-xs text-muted-foreground">Soon</span>
              </button>
              <Link
                to="/settings/account"
                className="flex items-center gap-3 border-t border-border px-4 py-3.5"
              >
                <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-danger/10 text-danger">
                  <Shield className="size-4" />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-sm font-semibold text-danger">Delete account</p>
                  <p className="text-xs text-muted-foreground">Permanently remove your data</p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            </div>
          </div>

          {/* Support */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Support
            </p>
            <div className="space-y-1 rounded-2xl border border-border bg-surface">
              <button
                onClick={() =>
                  window.open(
                    "mailto:support@queueless.app?subject=QueueLess Support Request",
                    "_blank",
                  )
                }
                className="flex w-full items-center gap-3 px-4 py-3.5"
              >
                <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-muted text-muted-foreground">
                  <HelpCircle className="size-4" />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-sm font-semibold">Contact support</p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </button>
              <button
                onClick={() =>
                  alert(
                    "QueueLess v1.0.0\n\nA community-powered wait time app for the New Orleans metro area.\n\n© 2024 QueueLess",
                  )
                }
                className="flex w-full items-center gap-3 border-t border-border px-4 py-3.5"
              >
                <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-muted text-muted-foreground">
                  <Info className="size-4" />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-sm font-semibold">About QueueLess</p>
                  <p className="text-xs text-muted-foreground">Version 1.0.0</p>
                </div>
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
    </>
  );
}
