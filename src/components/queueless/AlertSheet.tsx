import { useState, useEffect, useCallback } from "react";
import { X, Bell, BellOff, Check, Loader2, Trash2 } from "lucide-react";
import { useAlerts, useAlertForBusiness } from "@/lib/alerts";
import { useReputation } from "@/lib/reputation";
import { useAuth } from "@/lib/auth";
import type { WaitAlert } from "@/lib/queueless.functions";

// Wait time threshold options (in minutes)
const WAIT_THRESHOLDS = [
  { label: "Under 5 min", value: 5 },
  { label: "Under 10 min", value: 10 },
  { label: "Under 15 min", value: 15 },
  { label: "Under 20 min", value: 20 },
  { label: "Under 30 min", value: 30 },
  { label: "Under 45 min", value: 45 },
  { label: "Under 60 min", value: 60 },
];

interface AlertSheetProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
  businessName: string;
  currentWait?: number | null;
}

export function AlertSheet({
  isOpen,
  onClose,
  businessId,
  businessName,
  currentWait,
}: AlertSheetProps) {
  const { user } = useAuth();
  const { reporterKey } = useReputation();
  const { alert, isLoading: alertLoading, refetch: refetchAlert } = useAlertForBusiness(businessId);
  const { createAlert, removeAlert, toggleAlert, isLoading: alertsLoading } = useAlerts();

  const [selectedThreshold, setSelectedThreshold] = useState<number>(15);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when sheet opens
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setShowSuccess(false);
      if (alert?.thresholdMinutes) {
        setSelectedThreshold(alert.thresholdMinutes);
      }
    }
  }, [isOpen, alert?.thresholdMinutes]);

  // Handle creating an alert
  const handleCreateAlert = useCallback(async () => {
    setError(null);
    const result = await createAlert(businessId, selectedThreshold);
    
    if (result.success) {
      setShowSuccess(true);
      await refetchAlert();
      // Close after success
      setTimeout(() => {
        onClose();
        setShowSuccess(false);
      }, 1500);
    } else {
      setError(result.error || "Failed to create alert");
    }
  }, [businessId, selectedThreshold, createAlert, refetchAlert, onClose]);

  // Handle deleting an alert
  const handleDeleteAlert = useCallback(async () => {
    if (!alert?.id) return;
    
    setError(null);
    const result = await removeAlert(alert.id);
    
    if (result.success) {
      await refetchAlert();
      onClose();
    } else {
      setError(result.error || "Failed to remove alert");
    }
  }, [alert?.id, removeAlert, refetchAlert, onClose]);

  // Handle toggling alert
  const handleToggleAlert = useCallback(async () => {
    if (!alert?.id) return;
    
    setError(null);
    const result = await toggleAlert(alert.id, !alert.enabled);
    
    if (result.success) {
      await refetchAlert();
    } else {
      setError(result.error || "Failed to update alert");
    }
  }, [alert, toggleAlert, refetchAlert]);

  if (!isOpen) return null;

  const isProcessing = alertsLoading || alertLoading;
  const hasAlert = !!alert;
  const userId = user?.id || reporterKey;

  // User must be logged in to create alerts
  if (!userId) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/50" 
          onClick={onClose}
        />
        
        {/* Sheet */}
        <div className="relative w-full max-w-[430px] animate-slide-up rounded-t-3xl bg-surface px-5 py-6 pb-8">
          {/* Handle */}
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted-foreground/30" />
          
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-xl bg-brand/10 text-brand">
                <Bell className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Wait Time Alert</h2>
                <p className="text-xs text-muted-foreground">{businessName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="grid size-9 place-items-center rounded-full bg-surface-muted text-muted-foreground"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Sign in prompt */}
          <div className="rounded-2xl border border-border bg-surface-muted p-4 text-center">
            <Bell className="mx-auto mb-2 size-8 text-muted-foreground" />
            <p className="font-semibold">Sign in to create alerts</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create a free account to get notified when wait times drop at your favorite places.
            </p>
            <a
              href="/sign-in"
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-brand px-6 py-3 text-sm font-bold text-brand-foreground"
            >
              Sign In / Sign Up
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div className="relative w-full max-w-[430px] animate-slide-up rounded-t-3xl bg-surface px-5 py-6 pb-8">
        {/* Handle */}
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted-foreground/30" />
        
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-brand/10 text-brand">
              <Bell className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Wait Time Alert</h2>
              <p className="text-xs text-muted-foreground">{businessName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid size-9 place-items-center rounded-full bg-surface-muted text-muted-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Loading state */}
        {isProcessing && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Success state */}
        {!isProcessing && showSuccess && (
          <div className="rounded-2xl border border-safe/30 bg-safe/10 p-6 text-center">
            <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-safe/20 text-safe">
              <Check className="size-6" />
            </div>
            <p className="font-bold text-safe">Alert created!</p>
            <p className="mt-1 text-sm text-muted-foreground">
              We'll notify you when the wait drops below {selectedThreshold} minutes.
            </p>
          </div>
        )}

        {/* Existing alert */}
        {!isProcessing && !showSuccess && hasAlert && (
          <div className="space-y-4">
            {/* Current alert status */}
            <div className="rounded-2xl border border-border bg-surface-muted p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {alert.enabled ? (
                    <div className="grid size-10 place-items-center rounded-full bg-safe/10 text-safe">
                      <Bell className="size-5" />
                    </div>
                  ) : (
                    <div className="grid size-10 place-items-center rounded-full bg-muted-foreground/10 text-muted-foreground">
                      <BellOff className="size-5" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold">
                      Alert: Under {alert.thresholdMinutes} min
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {alert.enabled ? "Active" : "Paused"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleToggleAlert}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                    alert.enabled
                      ? "bg-caution/15 text-caution"
                      : "bg-safe/15 text-safe"
                  }`}
                >
                  {alert.enabled ? "Pause" : "Resume"}
                </button>
              </div>
            </div>

            {/* Update threshold */}
            <div>
              <p className="mb-2 text-sm font-semibold">Update threshold</p>
              <div className="grid grid-cols-3 gap-2">
                {WAIT_THRESHOLDS.map((threshold) => (
                  <button
                    key={threshold.value}
                    onClick={() => setSelectedThreshold(threshold.value)}
                    className={`rounded-xl border py-2.5 text-xs font-bold transition-colors ${
                      selectedThreshold === threshold.value
                        ? "border-brand bg-brand/10 text-brand"
                        : "border-border bg-surface text-foreground"
                    }`}
                  >
                    {threshold.value} min
                  </button>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleDeleteAlert}
                disabled={alertsLoading}
                className="flex items-center justify-center gap-2 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm font-bold text-danger"
              >
                <Trash2 className="size-4" />
                Remove Alert
              </button>
              <button
                onClick={handleCreateAlert}
                disabled={alertsLoading || selectedThreshold === alert.thresholdMinutes}
                className="flex-1 rounded-xl bg-brand py-3 text-sm font-bold text-brand-foreground disabled:opacity-50"
              >
                Update Threshold
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Create new alert */}
        {!isProcessing && !showSuccess && !hasAlert && (
          <div className="space-y-4">
            {/* Current wait info */}
            {currentWait != null && (
              <div className="rounded-xl border border-border bg-surface-muted p-3 text-center">
                <p className="text-xs text-muted-foreground">Current wait</p>
                <p className="text-2xl font-black">{currentWait} min</p>
              </div>
            )}

            {/* Threshold selector */}
            <div>
              <p className="mb-2 text-sm font-semibold">
                Notify me when wait is under...
              </p>
              <div className="grid grid-cols-3 gap-2">
                {WAIT_THRESHOLDS.map((threshold) => (
                  <button
                    key={threshold.value}
                    onClick={() => setSelectedThreshold(threshold.value)}
                    className={`rounded-xl border py-2.5 text-xs font-bold transition-colors ${
                      selectedThreshold === threshold.value
                        ? "border-brand bg-brand/10 text-brand"
                        : "border-border bg-surface text-foreground"
                    }`}
                  >
                    {threshold.value} min
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-muted-foreground">
              You'll receive an in-app notification when the wait time drops below {selectedThreshold} minutes. 
              We won't spam you — notifications are limited to prevent abuse.
            </p>

            {/* Create button */}
            <button
              onClick={handleCreateAlert}
              disabled={alertsLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3.5 text-sm font-bold text-brand-foreground disabled:opacity-50"
            >
              {alertsLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Bell className="size-4" />
                  Create Alert
                </>
              )}
            </button>

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
                {error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
