import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, XCircle, Mail } from "lucide-react";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Processing your authentication...");

  useEffect(() => {
    async function handleAuthCallback() {
      console.log("[AuthCallback] Processing auth callback...");
      
      // Get the URL search params
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");
      const type = params.get("type");
      const error = params.get("error");
      const errorCode = params.get("error_code");
      
      console.log("[AuthCallback] URL params:", { token: !!token, type, error, errorCode });

      if (error) {
        console.log("[AuthCallback] Error in URL:", error, errorCode);
        setStatus("error");
        setMessage(`Authentication error: ${error}`);
        return;
      }

      try {
        // The getSession() call will automatically process the token from the URL
        // and set up the session if the token is valid
        const { data, error: sessionError } = await supabase.auth.getSession();
        
        console.log("[AuthCallback] getSession result:", { 
          hasSession: !!data.session,
          hasUser: !!data.user,
          userEmail: data.user?.email,
          emailConfirmed: !!data.user?.email_confirmed_at,
          error: sessionError 
        });

        if (sessionError) {
          console.log("[AuthCallback] Session error:", sessionError);
          setStatus("error");
          setMessage(`Session error: ${sessionError.message}`);
          return;
        }

        if (!data.session) {
          console.log("[AuthCallback] No session after getSession");
          setStatus("error");
          setMessage("Unable to establish session. Please try signing in again.");
          return;
        }

        // Check if this is an email confirmation
        if (type === "signup" || type === "email_change") {
          console.log("[AuthCallback] Email confirmed! Redirecting to profile...");
          setStatus("success");
          setMessage("Email verified successfully!");
          // Small delay to show success message
          setTimeout(() => {
            navigate({ to: "/profile" });
          }, 1500);
        } else if (type === "recovery") {
          console.log("[AuthCallback] Password recovery flow");
          setStatus("success");
          setMessage("Password reset link verified!");
          setTimeout(() => {
            navigate({ to: "/profile" });
          }, 1500);
        } else {
          console.log("[AuthCallback] Generic auth callback - redirecting to profile");
          setStatus("success");
          setMessage("Authenticated successfully!");
          setTimeout(() => {
            navigate({ to: "/profile" });
          }, 1500);
        }
      } catch (err) {
        console.log("[AuthCallback] Unexpected error:", err);
        setStatus("error");
        setMessage("An unexpected error occurred");
      }
    }

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 text-center">
        {status === "loading" && (
          <>
            <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-brand/10">
              <Loader2 className="size-8 animate-spin text-brand" />
            </div>
            <h1 className="text-xl font-bold">Processing...</h1>
            <p className="mt-2 text-sm text-muted-foreground">{message}</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-safe/10">
              <CheckCircle className="size-8 text-safe" />
            </div>
            <h1 className="text-xl font-bold text-safe">Success!</h1>
            <p className="mt-2 text-sm text-muted-foreground">{message}</p>
            <p className="mt-4 text-xs text-muted-foreground">Redirecting to profile...</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-danger/10">
              <XCircle className="size-8 text-danger" />
            </div>
            <h1 className="text-xl font-bold text-danger">Error</h1>
            <p className="mt-2 text-sm text-muted-foreground">{message}</p>
            <div className="mt-6 flex flex-col gap-3">
              <Link
                to="/sign-in"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-bold text-brand-foreground"
              >
                <Mail className="size-4" />
                Go to Sign In
              </Link>
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-medium"
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
