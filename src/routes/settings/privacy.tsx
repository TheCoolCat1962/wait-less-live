import { createFileRoute, Link } from "@tanstack/react-router";
import { 
  ArrowLeft, 
  Eye, 
  EyeOff,
  Shield, 
  CheckCircle,
  Loader2,
} from "lucide-react";
import { useSettings } from "@/lib/settings";

export const Route = createFileRoute("/settings/privacy")({
  component: PrivacyPage,
});

function PrivacyPage() {
  const { settings, toggleSetting, syncing } = useSettings();

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-surface/90 px-4 py-3 backdrop-blur">
        <Link 
          to="/settings" 
          className="grid size-9 place-items-center rounded-full bg-surface-muted"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Settings
          </p>
          <h1 className="text-lg font-extrabold tracking-tight">Privacy Settings</h1>
        </div>
        {syncing && (
          <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
            <Loader2 className="size-3 animate-spin" />
            Saving
          </div>
        )}
      </header>

      {/* Content */}
      <main className="px-5 py-4">
        <div className="space-y-6">
          {/* Privacy Info */}
          <div className="flex items-start gap-3 rounded-2xl border border-brand/20 bg-brand/5 p-4">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
              <Shield className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Your Privacy Matters</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Control how your information is used and displayed in QueueLess. 
                These settings help protect your privacy while allowing you to 
                participate in the community.
              </p>
            </div>
          </div>

          {/* Privacy Settings */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Visibility
            </p>
            <div className="space-y-1 rounded-2xl border border-border bg-surface">
              {/* Show in Leaderboard */}
              <div className="flex items-center gap-3 px-4 py-4">
                <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-muted text-muted-foreground">
                  <Eye className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">Show in Leaderboard</p>
                  <p className="text-xs text-muted-foreground">
                    Display your username in community rankings
                  </p>
                </div>
                <button
                  onClick={() => toggleSetting("show_in_leaderboard")}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                    settings.show_in_leaderboard ? "bg-brand" : "bg-surface-muted"
                  }`}
                >
                  <span
                    className={`absolute top-1 size-4 rounded-full bg-white shadow transition-transform ${
                      settings.show_in_leaderboard ? "right-1" : "left-1"
                    }`}
                  />
                </button>
              </div>

              {/* Public Profile */}
              <div className="flex items-center gap-3 border-t border-border px-4 py-4">
                <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-muted text-muted-foreground">
                  {settings.show_in_leaderboard ? (
                    <Eye className="size-4" />
                  ) : (
                    <EyeOff className="size-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">Public Profile</p>
                  <p className="text-xs text-muted-foreground">
                    Allow others to see your activity and contributions
                  </p>
                </div>
                <span className={`text-xs font-medium ${
                  settings.show_in_leaderboard ? "text-safe" : "text-muted-foreground"
                }`}>
                  {settings.show_in_leaderboard ? "Enabled" : "Disabled"}
                </span>
              </div>
            </div>
          </div>

          {/* Data Collection */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Data Collection
            </p>
            <div className="space-y-1 rounded-2xl border border-border bg-surface">
              {/* Analytics */}
              <div className="flex items-center gap-3 px-4 py-4">
                <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-muted text-muted-foreground">
                  <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 3v18h18" />
                    <path d="M18 9l-5 5-4-4-3 3" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">Usage Analytics</p>
                  <p className="text-xs text-muted-foreground">
                    Help improve QueueLess by sharing anonymous usage data
                  </p>
                </div>
                <button
                  onClick={() => toggleSetting("allow_analytics")}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                    settings.allow_analytics ? "bg-brand" : "bg-surface-muted"
                  }`}
                >
                  <span
                    className={`absolute top-1 size-4 rounded-full bg-white shadow transition-transform ${
                      settings.allow_analytics ? "right-1" : "left-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Data Management */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Your Data
            </p>
            <div className="space-y-1 rounded-2xl border border-border bg-surface">
              <button
                onClick={() => alert("Data export feature coming soon! Your data will be exported as a JSON file.")}
                className="flex w-full items-center gap-3 px-4 py-4 text-left"
              >
                <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-muted text-muted-foreground">
                  <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">Export My Data</p>
                  <p className="text-xs text-muted-foreground">
                    Download all your data as a JSON file
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">Soon</span>
              </button>

              <button
                onClick={() => alert("Your favorites and reports are stored locally on this device. To delete them, clear your browser data for this site.")}
                className="flex w-full items-center gap-3 border-t border-border px-4 py-4 text-left"
              >
                <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-muted text-muted-foreground">
                  <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">Clear Local Data</p>
                  <p className="text-xs text-muted-foreground">
                    Remove favorites and reports from this device
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">Info</span>
              </button>
            </div>
          </div>

          {/* Privacy Policy */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Legal
            </p>
            <div className="space-y-1 rounded-2xl border border-border bg-surface">
              <button
                onClick={() => alert("Privacy Policy will open in a new tab.")}
                className="flex w-full items-center gap-3 px-4 py-4 text-left"
              >
                <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-muted text-muted-foreground">
                  <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">Privacy Policy</p>
                  <p className="text-xs text-muted-foreground">
                    Read our privacy policy
                  </p>
                </div>
              </button>

              <button
                onClick={() => alert("Terms of Service will open in a new tab.")}
                className="flex w-full items-center gap-3 border-t border-border px-4 py-4 text-left"
              >
                <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-muted text-muted-foreground">
                  <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">Terms of Service</p>
                  <p className="text-xs text-muted-foreground">
                    Read our terms of service
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Info Note */}
          <p className="text-center text-xs text-muted-foreground">
            Changes to privacy settings are saved automatically and apply immediately.
          </p>
        </div>
      </main>
    </>
  );
}
