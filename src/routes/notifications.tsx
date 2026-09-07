import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bell,
  BellOff,
  ChevronRight,
  Loader2,
  MapPin,
  Star,
  Clock,
  Check,
  X,
} from "lucide-react";
import { AppShell } from "@/components/queueless/AppShell";
import { useNotifications } from "@/lib/alerts";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/notifications")({
  component: NotificationsPage,
});

type NotificationType = "wait_alert" | "report_confirmed" | "badge_earned" | "system";

interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  business_id?: string;
  read: boolean;
  created_at: string;
}

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case "wait_alert":
      return Bell;
    case "report_confirmed":
      return Check;
    case "badge_earned":
      return Star;
    case "system":
    default:
      return Bell;
  }
}

function formatTime(dateString: string): string {
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  } catch {
    return "Unknown";
  }
}

function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  return (
    <AppShell>
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-surface/90 px-5 py-4 backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Stay updated
            </p>
            <h1 className="text-xl font-extrabold tracking-tight">Notifications</h1>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-brand hover:text-brand disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Check className="size-3.5" />
              )}
              Mark all read
            </button>
          )}
        </div>
      </header>

      {/* Loading State */}
      {isLoading && notifications.length === 0 && (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading notifications...
        </div>
      )}

      {/* Content */}
      <main className="px-5 py-4">
        {notifications.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="grid size-14 place-items-center rounded-2xl bg-surface-muted text-muted-foreground">
              <BellOff className="size-6" />
            </div>
            <h2 className="mt-4 text-lg font-extrabold">No notifications yet</h2>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              When you create wait time alerts and the conditions are met, you'll get notified here.
            </p>
            <Link
              to="/"
              className="mt-6 rounded-xl bg-brand px-5 py-3 text-sm font-bold text-brand-foreground shadow-lg shadow-brand/30"
            >
              Find places to monitor
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification: any) => {
              const Icon = getNotificationIcon(notification.type as NotificationType);
              return (
                <div
                  key={notification.id}
                  className={`group relative rounded-2xl border p-4 transition-colors ${
                    notification.read
                      ? "border-border bg-surface"
                      : "border-brand/30 bg-brand/5"
                  }`}
                >
                  <button
                    onClick={() => markAsRead(notification.id)}
                    className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
                    title="Dismiss"
                  >
                    <X className="size-4 text-muted-foreground hover:text-foreground" />
                  </button>
                  <div className="flex gap-3">
                    <div
                      className={`grid size-10 shrink-0 place-items-center rounded-xl ${
                        notification.read
                          ? "bg-surface-muted text-muted-foreground"
                          : "bg-brand/10 text-brand"
                      }`}
                    >
                      <Icon className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold">{notification.title}</p>
                        {!notification.read && (
                          <span className="size-2 shrink-0 rounded-full bg-brand" />
                        )}
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {notification.body}
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <Clock className="size-3" />
                        <span>{formatTime(notification.created_at)}</span>
                        {notification.business_id && (
                          <>
                            <span>·</span>
                            <MapPin className="size-3" />
                            <span>View business</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {notification.business_id && (
                    <Link
                      to={`/business/${notification.business_id}`}
                      className="absolute bottom-4 right-4 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Notification Settings Info */}
        <div className="mt-8 space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            About wait time alerts
          </p>
          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-start gap-3">
              <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
                <Bell className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">How alerts work</p>
                <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                  <li>• Favorite a business on any business page</li>
                  <li>• Tap the bell icon to create an alert</li>
                  <li>• Choose your wait time threshold</li>
                  <li>• Get notified when wait drops below it</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-start gap-3">
              <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-safe/10 text-safe">
                <Check className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">Anti-spam measures</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  To prevent notification fatigue, we limit alerts to one notification per alert 
                  per 30 minutes. Alerts can be paused or deleted at any time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
