import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, XCircle, Mail, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallbackPage,
});

type CallbackStatus = "loading" | "success" | "error" | "email_confirmed";

/**
 * Safely resolve a redirect target to prevent open-redirect attacks.
 * Only allows same-origin relative paths: "/" or paths starting with "/" but not "//".
 */
function safeRedirectUrl(next: string | null | undefined, fallback: string): string {
  if (!next) return fallback;
  if (next.startsWith('//')) return fallback;
  const isValidPath = next === '/' || (/^\/[^\/\\].*/.test(next) && !next.startsWith('//'));
  const hasUnsafeChars = /[\p{C}\\]|[\0%00]/.test(next);
  if (!isValidPath || hasUnsafeChars) return fallback;
  return next;
}

function AuthCallbackPage() {
  const [status, setStatus] = useState<CallbackStatus>("loading");
  const [message, setMessage] = useState("Processing your authentication...");
  const [details, setDetails] = useState<string | null>(null);
  const [showResendOption, setShowResendOption] = useState(false);
  const redirectCompleted = useRef(false);

  useEffect(() => {
    async function handleAuthCallback() {
      console.log("[AuthCallback] Processing auth callback...");
      
      const params = new URLSearchParams(window.location.search);
      const type = params.get("type");
      const error = params.get("error");
      const errorCode = params.get("error_code");
      const tokenHash = params.get("token_hash");
      const code = params.get("code");
      const next = params.get("next");
      
      console.log("[AuthCallback] URL params:", { type, error, errorCode, hasTokenHash: !!tokenHash, hasCode: !!code });

      // Handle explicit errors from Supabase
      if (error) {
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
        // STEP 1: Try to exchange code for session (this is the modern Supabase flow)
        if (code) {
          console.log("[AuthCallback] Exchanging code for session...");
          const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            console.error("[AuthCallback] Code exchange error:", exchangeError);
            setStatus("error");
            setMessage("Authentication failed");
            setDetails(exchangeError.message);
            setShowResendOption(true);
            return;
          }
          
          if (exchangeData.session && exchangeData.user) {
            console.log("[AuthCallback] Session established via code exchange:", {
              userEmail: exchangeData.user.email,
              emailConfirmed: !!exchangeData.user.email_confirmed_at
            });
            
            // Success! Redirect to profile
            setStatus("success");
            setMessage("Welcome to QueueLess!");
            setDetails("Your account is ready. Redirecting...");
            redirectToProfile();
            return;
          }
        }

        // STEP 2: If no code, try token_hash verification
        if (tokenHash && (type === "signup" || type === "confirmation" || type === "email_change" || type === "recovery")) {
          console.log("[AuthCallback] Verifying with token_hash...");
          const verifyType = type === "confirmation" ? "signup" : type;
          
          const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
            type: verifyType as 'signup' | 'recovery' | 'email_change',
            token_hash: tokenHash,
          });
          
          if (verifyError) {
            console.error("[AuthCallback] Token verification error:", verifyError);
            setStatus("error");
            setMessage("Verification failed");
            setDetails(verifyError.message);
            setShowResendOption(true);
            return;
          }
          
          if (verifyData.session && verifyData.user) {
            console.log("[AuthCallback] Session established via token verification:", {
              userEmail: verifyData.user.email,
              emailConfirmed: !!verifyData.user.email_confirmed_at
            });
            
            setStatus("success");
            setMessage("Email verified!");
            setDetails("Your account is ready. Redirecting...");
            redirectToProfile();
            return;
          }
        }

        // STEP 3: Check for existing session (might have been set by another tab or auto-refresh)
        console.log("[AuthCallback] Checking for existing session...");
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("[AuthCallback] Session check error:", sessionError);
        }
        
        if (sessionData.session && sessionData.user) {
          console.log("[AuthCallback] Existing session found:", {
            userEmail: sessionData.user.email,
            emailConfirmed: !!sessionData.user.email_confirmed_at
          });
          
          setStatus("success");
          setMessage("Welcome back!");
          setDetails("You're already signed in. Redirecting...");
          redirectToProfile();
          return;
        }

        // STEP 4: Nothing worked - show error
        console.log("[AuthCallback] No session established");
        setStatus("error");
        setMessage("Authentication incomplete");
        setDetails("We couldn't complete the authentication. Please try signing in again.");
        setShowResendOption(true);
        
      } catch (err) {
        console.error("[AuthCallback] Unexpected error:", err);
        setStatus("error");
        setMessage("An unexpected error occurred");
        setDetails(err instanceof Error ? err.message : "Unknown error");
        setShowResendOption(true);
      }
    }

    function redirectToProfile() {
      if (redirectCompleted.current) return;
      redirectCompleted.current = true;
      // Small delay to show success message, then redirect
      setTimeout(() => {
        window.location.href = "/profile";
      }, 1500);
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
