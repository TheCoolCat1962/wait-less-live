/**
 * Auth URL helpers for QueueLess
 * These functions help construct proper redirect URLs for Supabase auth flows.
 */

/**
 * Get the base URL of the QueueLess application.
 * Uses VITE_APP_URL if set, otherwise falls back to the current window origin.
 */
export function getAppBaseUrl(): string {
  // Check for explicitly configured URL first
  const configuredUrl = import.meta.env.VITE_APP_URL;
  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, ''); // Remove trailing slash
  }
  
  // Fall back to current window origin (works for both SPA and SSR)
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // SSR fallback - should not happen in practice
  return 'https://app.queueless.app';
}

/**
 * Get the full URL for the auth callback page.
 * This is where Supabase redirects after email confirmation.
 */
export function getAuthCallbackUrl(): string {
  return `${getAppBaseUrl()}/auth/callback`;
}

/**
 * Get the URL to redirect after successful authentication.
 */
export function getPostAuthUrl(): string {
  return `${getAppBaseUrl()}/profile`;
}
