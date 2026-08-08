-- =============================================================================
-- WAIT TIME ALERTS TABLE
-- 
-- Stores user preferences for wait-time alerts on favorited businesses.
-- Users can set a threshold (e.g., "notify me when wait is under 15 minutes").
-- When a new wait report meets the threshold, the user is notified.
-- =============================================================================

-- Table to store wait time alerts
CREATE TABLE public.wait_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- User who created the alert (references auth.users)
  user_id UUID NOT NULL,
  
  -- The business to monitor
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  
  -- Wait threshold in minutes (e.g., 15 = notify when wait is under 15 min)
  threshold_minutes INTEGER NOT NULL CHECK (threshold_minutes > 0 AND threshold_minutes <= 240),
  
  -- Whether the alert is active
  enabled BOOLEAN NOT NULL DEFAULT true,
  
  -- When the user was last notified (to prevent duplicate notifications)
  notified_at TIMESTAMPTZ,
  
  -- When the alert was created
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- When the alert was last updated
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Unique constraint: one alert per user per business
  CONSTRAINT wait_alerts_user_business_unique UNIQUE (user_id, business_id)
);

-- Indexes for common queries
CREATE INDEX wait_alerts_user_id_idx ON public.wait_alerts (user_id);
CREATE INDEX wait_alerts_business_id_idx ON public.wait_alerts (business_id);
CREATE INDEX wait_alerts_enabled_idx ON public.wait_alerts (enabled) WHERE enabled = true;

-- RLS: Users can only manage their own alerts
ALTER TABLE public.wait_alerts ENABLE ROW LEVEL SECURITY;

-- Users can read their own alerts
CREATE POLICY "Users can read their own alerts" ON public.wait_alerts
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own alerts
CREATE POLICY "Users can insert their own alerts" ON public.wait_alerts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own alerts
CREATE POLICY "Users can update their own alerts" ON public.wait_alerts
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own alerts
CREATE POLICY "Users can delete their own alerts" ON public.wait_alerts
  FOR DELETE USING (auth.uid() = user_id);

-- Service role has full access for notification checking
CREATE POLICY "Service role can manage all alerts" ON public.wait_alerts
  FOR ALL TO service_role USING (true);

-- =============================================================================
-- WAIT ALERT NOTIFICATIONS TABLE
-- 
-- Stores individual notification events for audit trail and in-app display.
-- =============================================================================

CREATE TABLE public.wait_alert_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- The alert that triggered this notification
  alert_id UUID NOT NULL REFERENCES public.wait_alerts(id) ON DELETE CASCADE,
  
  -- The wait report that triggered the notification
  wait_report_id UUID NOT NULL REFERENCES public.wait_reports(id) ON DELETE CASCADE,
  
  -- The wait time at notification time
  wait_minutes INTEGER NOT NULL,
  
  -- Whether the notification was delivered
  delivered BOOLEAN NOT NULL DEFAULT false,
  
  -- When the notification was created
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Unique: don't notify for the same report-alert combination twice
  CONSTRAINT wait_alert_notifications_unique UNIQUE (alert_id, wait_report_id)
);

-- Index for checking recent notifications
CREATE INDEX wait_alert_notifications_alert_id_idx ON public.wait_alert_notifications (alert_id);
CREATE INDEX wait_alert_notifications_created_at_idx ON public.wait_alert_notifications (created_at DESC);

-- RLS: Users can read their own notifications
ALTER TABLE public.wait_alert_notifications ENABLE ROW LEVEL SECURITY;

-- Users can read notifications for their own alerts
CREATE POLICY "Users can read their own notifications" ON public.wait_alert_notifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.wait_alerts 
      WHERE wait_alerts.id = wait_alert_notifications.alert_id 
      AND wait_alerts.user_id = auth.uid()
    )
  );

-- =============================================================================
-- NOTIFICATION INBOX TABLE (for in-app notifications)
-- =============================================================================

CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- User who receives the notification
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Notification type
  type TEXT NOT NULL CHECK (type IN ('wait_alert', 'report_confirmed', 'badge_earned', 'system')),
  
  -- Title of the notification
  title TEXT NOT NULL,
  
  -- Notification body
  body TEXT NOT NULL,
  
  -- Related business (if applicable)
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  
  -- Whether the user has read the notification
  read BOOLEAN NOT NULL DEFAULT false,
  
  -- When the notification was created
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- When the notification was read (if ever)
  read_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX notifications_user_id_idx ON public.notifications (user_id);
CREATE INDEX notifications_user_unread_idx ON public.notifications (user_id) WHERE read = false;
CREATE INDEX notifications_created_at_idx ON public.notifications (created_at DESC);

-- RLS: Users can only see and manage their own notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Service role can insert notifications (for alert system)
CREATE POLICY "Service role can manage notifications" ON public.notifications
  FOR ALL TO service_role USING (true);

-- =============================================================================
-- REALTIME SUBSCRIPTIONS
-- Allow clients to subscribe to new notifications for their user
-- =============================================================================

-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
