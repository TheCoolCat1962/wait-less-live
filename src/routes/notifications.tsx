import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
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

export const Route = createFileRoute("/notifications")({
  component: NotificationsPage,
});

type Notification = {
  id: string;
  type: "wait_update" | "favorite_available" | "report_confirmed" | "badge_earned";
  title: string;
  message: string;
  businessName?: string;
  time: string;
  read: boolean;
  createdAt: Date;
};

// Mock notifications for demo purposes
const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "wait_update",
    title: "Wait time updated",
    message: "Café Du Monde now has a 15 minute wait",
    businessName: "Café Du Monde",
    time: "5 min ago",
    read: false,
    createdAt: new Date(Date.now() - 5 * 60 * 1000),
  },
  {
    id: "2",
    type: "favorite_available",
    title: "Your favorite has low wait",
    message: "Parker's Bar & Grill is reporting no wait!",
    businessName: "Parker's Bar & Grill",
    time: "1 hour ago",
    read: false,
    createdAt: new Date(Date.now() - 60 * 60 * 1000),
  },
  {
    id: "3",
    type: "report_confirmed",
    title: "Report confirmed",
    message: "Your wait time report was verified by another user",
    time: "3 hours ago",
    read: true,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
  },
  {
    id: "4",
    type: "badge_earned",
    title: "Badge earned!",
    message: "You earned the 'Early Bird' badge for reporting before 8 AM",
    time: "1 day ago",
    read: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
];

function getNotificationIcon(type: Notification["type"]) {
  switch (type) {
    case "wait_update":
      return Clock;
    case "favorite_available":
      return Star;
    case "report_confirmed":
      return Check;
    case "badge_earned":
      return Bell;
    default:
      return Bell;
  }
}

function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = async () => {
    setLoading(true);
    setError(null);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true }))
      );
    } catch (err) {
      setError("Failed to mark notifications as read");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const deleteNotification = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

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
              disabled={loading}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-brand hover:text-brand disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Check className="size-3.5" />
              )}
              Mark all read
            </button>
          )}
        </div>
      </header>

      {/* Error State */}
      {error && (
        <div className="mx-5 mt-4 rounded-xl border border-danger/30 bg-danger/10 p-4">
          <p className="text-sm font-medium text-danger">{error}</p>
        </div>
      )}

      {/* Content */}
      <main className="px-5 py-4">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="grid size-14 place-items-center rounded-2xl bg-surface-muted text-muted-foreground">
              <BellOff className="size-6" />
            </div>
            <h2 className="mt-4 text-lg font-extrabold">No notifications yet</h2>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              When you favorite places or submit reports, you'll get notified about
              updates here.
            </p>
            <Link
              to="/"
              className="mt-6 rounded-xl bg-brand px-5 py-3 text-sm font-bold text-brand-foreground shadow-lg shadow-brand/30"
            >
              Browse nearby
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => {
              const Icon = getNotificationIcon(notification.type);
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
                        {notification.message}
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <Clock className="size-3" />
                        <span>{notification.time}</span>
                        {notification.businessName && (
                          <>
                            <span>·</span>
                            <MapPin className="size-3" />
                            <span>{notification.businessName}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="absolute bottom-4 right-4 size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              );
            })}
          </div>
        )}

        {/* Notification Settings Info */}
        <div className="mt-8 space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Notification preferences
          </p>
          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Wait time alerts</p>
                <p className="text-xs text-muted-foreground">
                  Get notified when wait times change
                </p>
              </div>
              <button className="relative h-6 w-11 rounded-full bg-brand transition-colors">
                <span className="absolute right-1 top-1 size-4 rounded-full bg-white shadow" />
              </button>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Favorite updates</p>
                <p className="text-xs text-muted-foreground">
                  Alerts when favorites have low wait
                </p>
              </div>
              <button className="relative h-6 w-11 rounded-full bg-brand transition-colors">
                <span className="absolute right-1 top-1 size-4 rounded-full bg-white shadow" />
              </button>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Report feedback</p>
                <p className="text-xs text-muted-foreground">
                  Confirmation when reports are verified
                </p>
              </div>
              <button className="relative h-6 w-11 rounded-full bg-surface-muted transition-colors">
                <span className="absolute left-1 top-1 size-4 rounded-full bg-muted-foreground shadow" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
