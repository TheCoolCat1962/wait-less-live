import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, XCircle, Mail, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallbackPage,
});

type CallbackStatus = "loading" | "success" | "error" | "email_confirmed";

function AuthCallbackPage() {
  const [status, setStatus] = useState<CallbackStatus>("loading");
  const [message, setMessage] = useState("Processing your authentication...");
  const [details, setDetails] = useState<string | null>(null);
  const [showResendOption, setShowResendOption] = useState(false);

  useEffect(() => {
    async function handleAuthCallback() {
      console.log("[AuthCallback] Processing auth callback...");
      
      // Get the URL search params
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");
      const type = params.get("type");
      const error = params.get("error");
      const errorCode = params.get("error_code");
      const tokenHash = params.get("token_hash");
      const next = params.get("next");
      const email = params.get("email");
      
      console.log("[AuthCallback] URL params:", { 
        hasToken: !!token, 
        hasTokenHash: !!tokenHash,
        type, 
        error, 
        errorCode,
        next,
        email: email ? `${email.substring(0, 3)}...` : null
      });

      // Handle explicit errors from Supabase
      if (error) {
        console.log("[AuthCallback] Error in URL:", error, errorCode);
        
        let userMessage = "Authentication error";
        let userDetails: string | null = null;
        
        switch (error) {
          case "access_denied":
            userMessage = "Access denied";
            userDetails = "You don't have permission to access this resource.";
            break;
          case "otp_expired":
            userMessage = "Verification link expired";
            userDetails = "This verification link has expired. Please request a new one.";
            setShowResendOption(true);
            break;
          case "invalid_token":
          case "logout_required":
            userMessage = "Invalid verification link";
            userDetails = "This verification link is invalid or has already been used.";
            setShowResendOption(true);
            break;
          case "unauthorized":
            userMessage = "Unauthorized";
            userDetails = "Please sign in to continue.";
            break;
          case "user_already_exists":
            userMessage = "Account already exists";
            userDetails = "An account with this email already exists. Try signing in instead.";
            break;
          case "signup_disabled":
            userMessage = "Sign up disabled";
            userDetails = "Account creation is currently disabled.";
            break;
          default:
            userMessage = "Authentication error";
            userDetails = `Error: ${error}${errorCode ? ` (${errorCode})` : ""}`;
        }
        
        setStatus("error");
        setMessage(userMessage);
        setDetails(userDetails);
        return;
      }

      try {
        // For email confirmation, Supabase uses token_hash in the URL
        // The SDK's getSession() should automatically handle this
        const { data, error: sessionError } = await supabase.auth.getSession();
        
        console.log("[AuthCallback] getSession result:", { 
          hasSession: !!data.session,
          hasUser: !!data.user,
          userEmail: data.user?.email,
          emailConfirmed: !!data.user?.email_confirmed_at,
          error: sessionError?.message 
        });

        if (sessionError) {
          console.log("[AuthCallback] Session error:", sessionError);
          setStatus("error");
          setMessage("Session error");
          setDetails(sessionError.message);
          setShowResendOption(true);
          return;
        }

        // Check if user is now authenticated with a valid session
        if (data.session && data.user) {
          console.log("[AuthCallback] Session established successfully");
          
          // Determine the callback type and show appropriate message
          if (type === "recovery") {
            setStatus("success");
            setMessage("Password reset link verified!");
            setDetails("You can now set a new password.");
            // Redirect after showing success
            setTimeout(() => {
              window.location.href = "/profile";
            }, 2000);
          } else if (type === "signup" || type === "email_change" || type === "confirmation") {
            // Email confirmation successful
            setStatus("email_confirmed");
            setMessage("Email verified successfully!");
            setDetails("Your email has been confirmed. You can now sign in with your credentials.");
            // Redirect to sign in after showing success
            setTimeout(() => {
              window.location.href = "/sign-in?verified=true";
            }, 2500);
          } else if (type === "invite" || type === "magiclink") {
            setStatus("success");
            setMessage("Welcome!");
            setDetails("You've been authenticated. Redirecting...");
            setTimeout(() => {
              const redirectTo = next && next.startsWith('/') ? next : "/profile";
              window.location.href = redirectTo;
            }, 1500);
          } else {
            // Generic success
            setStatus("success");
            setMessage("Authenticated successfully!");
            const redirectTo = next && next.startsWith('/') ? next : "/profile";
            setTimeout(() => {
              window.location.href = redirectTo;
            }, 1500);
          }
          return;
        }

        // No session after getSession - check if this is an email confirmation
        // For confirmation-only flows, Supabase might not create a session
        if (type === "signup" || type === "email_change" || type === "confirmation") {
          console.log("[AuthCallback] Email confirmed (no session - confirmation-only flow)");
          setStatus("email_confirmed");
          setMessage("Email verified successfully!");
          setDetails("Your email has been confirmed. You can now sign in with your credentials.");
          // Redirect to sign in after showing success
          setTimeout(() => {
            window.location.href = "/sign-in?verified=true";
          }, 2500);
          return;
        }

        // No session and no identifiable type - show error with retry option
        console.log("[AuthCallback] No session after getSession");
        setStatus("error");
        setMessage("Unable to establish session");
        setDetails("The verification link may have expired or is invalid. Please try signing in.");
        setShowResendOption(true);
        
      } catch (err) {
        console.error("[AuthCallback] Unexpected error:", err);
        setStatus("error");
        setMessage("An unexpected error occurred");
        setDetails(err instanceof Error ? err.message : "Unknown error");
        setShowResendOption(true);
      }
    }

    handleAuthCallback();
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 text-center">
        {status === "loading" && (
          <>
            <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-brand/10">
              <Loader2 className="size-8 animate-spin text-brand" />
            </div>
            <h1 className="text-xl font-bold">Verifying...</h1>
            <p className="mt-2 text-sm text-muted-foreground">{message}</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-safe/10">
              <CheckCircle className="size-8 text-safe" />
            </div>
            <h1 className="text-xl font-bold text-safe">Success!</h1>
            <p className="mt-2 text-sm font-medium text-foreground">{message}</p>
            {details && <p className="mt-1 text-xs text-muted-foreground">{details}</p>}
            <p className="mt-4 text-xs text-muted-foreground animate-pulse">Redirecting...</p>
          </>
        )}

        {status === "email_confirmed" && (
          <>
            <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-safe/10">
              <CheckCircle className="size-8 text-safe" />
            </div>
            <h1 className="text-xl font-bold text-safe">Email Verified!</h1>
            <p className="mt-2 text-sm font-medium text-foreground">{message}</p>
            {details && <p className="mt-1 text-sm text-muted-foreground">{details}</p>}
            <div className="mt-6 flex flex-col gap-3">
              <Link
                to="/sign-in?verified=true"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-bold text-brand-foreground shadow-lg shadow-brand/30"
              >
                <Mail className="size-4" />
                Sign In Now
              </Link>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-danger/10">
              <XCircle className="size-8 text-danger" />
            </div>
            <h1 className="text-xl font-bold text-danger">{message}</h1>
            {details && <p className="mt-2 text-sm text-muted-foreground">{details}</p>}
            <div className="mt-6 flex flex-col gap-3">
              {showResendOption && (
                <div className="rounded-xl border border-border bg-surface-muted p-4">
                  <div className="mb-3 flex items-start gap-2 text-left">
                    <AlertCircle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      Didn't receive the email? Try signing up again to receive a new verification link.
                    </p>
                  </div>
                </div>
              )}
              <Link
                to="/sign-in"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-bold text-brand-foreground shadow-lg shadow-brand/30"
              >
                <Mail className="size-4" />
                Go to Sign In
              </Link>
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-medium hover:bg-surface-muted"
              >
                Go Home
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
