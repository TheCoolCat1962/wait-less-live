import type { AuthError } from "@supabase/supabase-js";

/**
 * Map Supabase auth errors to user-friendly messages
 */
export function getAuthErrorMessage(error: AuthError | null): string {
  if (!error) return "An unexpected error occurred";

  const { message, status } = error;

  // Common error codes and their user-friendly messages
  const errorMessages: Record<string, { title: string; description?: string }> = {
    // Sign in errors
    "Invalid login credentials": {
      title: "Invalid email or password",
      description: "Please check your credentials and try again.",
    },
    "Email not confirmed": {
      title: "Email not verified",
      description: "Please check your inbox and click the verification link to confirm your email.",
    },
    "Invalid email": {
      title: "Invalid email address",
      description: "Please enter a valid email address.",
    },
    "User not found": {
      title: "No account found",
      description: "No account exists with this email. Please create an account first.",
    },
    "User already registered": {
      title: "Email already registered",
      description: "An account with this email already exists. Try signing in instead.",
    },
    "Password not strong enough": {
      title: "Password too weak",
      description: "Please use a stronger password with at least 6 characters.",
    },
    "Signup requires a valid password": {
      title: "Invalid password",
      description: "Password must be at least 6 characters.",
    },
    "Unable to validate email address: Invalid": {
      title: "Invalid email address",
      description: "Please enter a valid email address.",
    },
    "Overlapping requests": {
      title: "Request in progress",
      description: "Please wait a moment and try again.",
    },
    "Only one request sent at a time": {
      title: "Request in progress",
      description: "Please wait for the current request to complete.",
    },
    // Network errors
    "fetch failed": {
      title: "Network error",
      description: "Please check your internet connection and try again.",
    },
    "Failed to fetch": {
      title: "Network error",
      description: "Please check your internet connection and try again.",
    },
    "Network request failed": {
      title: "Network error",
      description: "Please check your internet connection and try again.",
    },
  };

  // Check for exact match
  if (errorMessages[message]) {
    return `${errorMessages[message].title}${errorMessages[message].description ? `. ${errorMessages[message].description}` : ""}`;
  }

  // Check for partial matches
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes("network") ||
    lowerMessage.includes("fetch") ||
    lowerMessage.includes("connection")
  ) {
    return "Network error. Please check your internet connection and try again.";
  }

  if (lowerMessage.includes("invalid") && lowerMessage.includes("email")) {
    return "Invalid email address. Please check and try again.";
  }

  if (lowerMessage.includes("password") && lowerMessage.includes("weak")) {
    return "Password is too weak. Please use at least 6 characters.";
  }

  if (lowerMessage.includes("already") && lowerMessage.includes("exist")) {
    return "An account with this email already exists. Try signing in instead.";
  }

  if (lowerMessage.includes("not confirmed") || lowerMessage.includes("not verified")) {
    return "Email not verified. Please check your inbox and click the verification link.";
  }

  if (
    lowerMessage.includes("expired") ||
    (lowerMessage.includes("invalid") && lowerMessage.includes("token"))
  ) {
    return "Verification link has expired or is invalid. Please request a new one.";
  }

  // Status-based fallbacks
  if (status === 400) {
    return "Invalid request. Please check your input and try again.";
  }

  if (status === 401) {
    return "Authentication failed. Please check your credentials.";
  }

  if (status === 403) {
    return "Access denied. Please sign in again.";
  }

  if (status === 404) {
    return "Account not found. Please create an account first.";
  }

  if (status === 429) {
    return "Too many requests. Please wait a moment and try again.";
  }

  if (status === 500 || status === 502 || status === 503) {
    return "Server error. Please try again later.";
  }

  // Default fallback
  return message || "An unexpected error occurred. Please try again.";
}

/**
 * Check if error is related to email confirmation
 */
export function isEmailConfirmationError(error: AuthError | null): boolean {
  if (!error) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("not confirmed") ||
    message.includes("not verified") ||
    (message.includes("email") && message.includes("confirm"))
  );
}

/**
 * Check if error is related to invalid credentials
 */
export function isInvalidCredentialsError(error: AuthError | null): boolean {
  if (!error) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("invalid") ||
    message.includes("wrong password") ||
    message.includes("incorrect password")
  );
}

/**
 * Check if error is network related
 */
export function isNetworkError(error: AuthError | null): boolean {
  if (!error) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("network") ||
    message.includes("fetch") ||
    message.includes("connection") ||
    message.includes("timeout")
  );
}

/**
 * Get human-readable auth event type
 */
export function getAuthEventLabel(event: string): string {
  const labels: Record<string, string> = {
    SIGNED_IN: "Signed in",
    SIGNED_OUT: "Signed out",
    USER_UPDATED: "Account updated",
    PASSWORD_RECOVERY: "Password recovery",
    TOKEN_REFRESHED: "Session refreshed",
    MFA_CHALLENGE_VERIFIED: "MFA verified",
  };
  return labels[event] || event;
}
