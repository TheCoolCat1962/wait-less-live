import { useCallback, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createOrUpdateWaitAlert,
  deleteWaitAlert,
  getWaitAlertForBusiness,
  getUserWaitAlerts,
  toggleWaitAlert,
  type WaitAlert,
} from "./queueless.functions";
import { useReputation } from "./reputation";
import { useAuth } from "./auth";
import { supabase } from "@/integrations/supabase/client";

export interface WaitAlertWithBusiness extends WaitAlert {
  business?: {
    id: string;
    name: string;
    category: string | null;
    logoUrl: string | null;
  };
}

export function useAlerts() {
  const { user } = useAuth();
  const { reporterKey } = useReputation();
  const qc = useQueryClient();

  // Use user ID for authenticated users, reporter key for anonymous
  const userId = user?.id || reporterKey;

  // Get all user's alerts
  const {
    data: userAlerts = [],
    isLoading: alertsLoading,
    refetch: refetchAlerts,
  } = useQuery({
    queryKey: ["wait-alerts", userId],
    queryFn: () => getUserWaitAlerts({ data: { userId: userId ?? undefined } }),
    enabled: !!userId,
    staleTime: 60_000,
  });

  // Create or update an alert
  const createAlert = useCallback(
    async (businessId: string, thresholdMinutes: number) => {
      if (!userId) return { success: false, error: "User identification required" };

      try {
        const alert = await createOrUpdateWaitAlert({
          data: { businessId, thresholdMinutes, userId },
        });
        await refetchAlerts();
        return { success: true, alert };
      } catch (err) {
        console.error("[Alerts] Error creating alert:", err);
        return { success: false, error: (err as Error).message };
      }
    },
    [userId, refetchAlerts]
  );

  // Delete an alert
  const removeAlert = useCallback(
    async (alertId: string) => {
      if (!userId) return { success: false, error: "User identification required" };

      try {
        await deleteWaitAlert({ data: { alertId, userId } });
        await refetchAlerts();
        return { success: true };
      } catch (err) {
        console.error("[Alerts] Error deleting alert:", err);
        return { success: false, error: (err as Error).message };
      }
    },
    [userId, refetchAlerts]
  );

  // Toggle alert enabled status
  const toggleAlert = useCallback(
    async (alertId: string, enabled: boolean) => {
      if (!userId) return { success: false, error: "User identification required" };

      try {
        await toggleWaitAlert({ data: { alertId, enabled, userId } });
        await refetchAlerts();
        return { success: true };
      } catch (err) {
        console.error("[Alerts] Error toggling alert:", err);
        return { success: false, error: (err as Error).message };
      }
    },
    [userId, refetchAlerts]
  );

  return {
    alerts: userAlerts,
    isLoading: alertsLoading,
    createAlert,
    removeAlert,
    toggleAlert,
    refetchAlerts,
  };
}

// Hook to get alert for a specific business
export function useAlertForBusiness(businessId: string | undefined) {
  const { user } = useAuth();
  const { reporterKey } = useReputation();
  const userId = user?.id || reporterKey;

  const {
    data: alert,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["wait-alert", businessId, userId],
    queryFn: () => getWaitAlertForBusiness({ data: { businessId: businessId!, userId: userId ?? undefined } }),
    enabled: !!businessId && !!userId,
    staleTime: 30_000,
  });

  return { alert: alert as WaitAlert | null, isLoading, refetch };
}

// Hook for in-app notifications
export function useNotifications() {
  const { user } = useAuth();
  const { reporterKey } = useReputation();
  const userId = user?.id || reporterKey;

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) {
        console.error("[Notifications] Error fetching:", error);
        return;
      }

      setNotifications(data || []);
      setUnreadCount((data || []).filter((n) => !n.read).length);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Mark notification as read
  const markAsRead = useCallback(
    async (notificationId: string) => {
      try {
        await supabase
          .from("notifications")
          .update({ read: true, read_at: new Date().toISOString() })
          .eq("id", notificationId);

        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error("[Notifications] Error marking as read:", err);
      }
    },
    []
  );

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!userId) return;

    try {
      await supabase
        .from("notifications")
        .update({ read: true, read_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("read", false);

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("[Notifications] Error marking all as read:", err);
    }
  }, [userId]);

  // Subscribe to new notifications (realtime)
  useEffect(() => {
    if (!userId) return;

    fetchNotifications();

    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as any, ...prev]);
          if (!(payload.new as any).read) {
            setUnreadCount((prev) => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
}
