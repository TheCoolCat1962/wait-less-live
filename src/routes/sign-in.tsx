import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { getAuthErrorMessage, isEmailConfirmationError } from "@/lib/auth-utils";
import { z } from "zod";
import {
  LogIn,
  Mail,
  Lock,
  Loader2,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  MailCheck,
} from "lucide-react";

const signInSearchSchema = z.object({
  verified: z.string().optional(),
});

export const Route = createFileRoute("/sign-in")({
  component: SignInPage,
  validateSearch: signInSearchSchema,
});

function SignInPage() {
  const navigate = useNavigate();
  const searchParams = useSearch({ from: "/sign-in" });
  const { user, signIn, signUp, loading: authLoading, isAuthenticated } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Wait for auth to initialize before making redirect decisions
  useEffect(() => {
    if (!authLoading) {
      setInitialized(true);
    }
  }, [authLoading]);

  // Redirect if already logged in (but only after auth is initialized)
  useEffect(() => {
    if (initialized && isAuthenticated) {
      console.log("[SignIn] User already authenticated, redirecting to profile");
      navigate({ to: "/profile" });
    }
  }, [initialized, isAuthenticated, navigate]);

  // Check for verified param from email confirmation redirect
  useEffect(() => {
    if (searchParams.verified && !isAuthenticated) {
      setSuccessMessage("Your email has been verified! Please sign in with your credentials.");
      // Clear the URL param without triggering navigation
      window.history.replaceState({}, '', '/sign-in');
    }
  }, [searchParams.verified, isAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    console.log("[SignIn] Form submitted, isSignUp:", isSignUp);

    try {
      if (isSignUp) {
        console.log("[SignIn] Attempting sign up...");
        const { error } = await signUp(email, password);
        console.log("[SignIn] Sign up result:", error);
        
        if (error) {
          const userMessage = getAuthErrorMessage(error);
          setError(userMessage);
          return;
        }
        
        // Sign up successful - show confirmation message
        setSuccessMessage(
          "Account created! Check your email and click the verification link to activate your account. (Check your spam folder too)"
        );
        // Clear form
        setEmail("");
        setPassword("");
        // Switch to sign-in mode after a moment
        setTimeout(() => {
          setIsSignUp(false);
        }, 3000);
      } else {
        console.log("[SignIn] Attempting sign in with:", email);
        const { error } = await signIn(email, password);
        console.log("[SignIn] Sign in result:", error);
        
        if (error) {
          const userMessage = getAuthErrorMessage(error);
          
          // Special handling for email confirmation
          if (isEmailConfirmationError(error)) {
            setError(`${userMessage} Check your inbox for the verification email.`);
          } else {
            setError(userMessage);
          }
          return;
        }
        
        setSuccessMessage("Successfully signed in!");
        // Small delay to show success message before navigating
        setTimeout(() => {
          navigate({ to: "/profile" });
        }, 500);
      }
    } catch (err) {
      console.error("[SignIn] Unexpected error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full max-w-[430px] bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-surface/90 px-5 py-4 backdrop-blur">
        <Link
          to="/profile"
          className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back
        </Link>
      </header>

      {/* Content */}
      <main className="flex min-h-[calc(100vh-65px)] flex-col px-5 py-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-brand text-2xl font-black text-brand-foreground">
            <LogIn className="size-8" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            {isSignUp ? "Create account" : "Welcome back"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isSignUp
              ? "Join QueueLess to sync favorites and earn reputation"
              : "Sign in to access your favorites and reputation"}
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-safe/30 bg-safe/10 p-4">
            <CheckCircle className="size-5 text-safe" />
            <p className="text-sm font-medium text-safe">{successMessage}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-danger/30 bg-danger/10 p-4">
            <AlertCircle className="mt-0.5 size-5 shrink-0 text-danger" />
            <p className="text-sm font-medium text-danger">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="text-sm font-semibold text-foreground"
            >
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={loading}
                className="w-full rounded-xl border border-border bg-surface py-3 pl-10 pr-4 text-sm font-medium placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:opacity-50"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="text-sm font-semibold text-foreground"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                disabled={loading}
                className="w-full rounded-xl border border-border bg-surface py-3 pl-10 pr-12 text-sm font-medium placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || authLoading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3.5 text-sm font-bold text-brand-foreground shadow-lg shadow-brand/30 transition-all hover:bg-brand/90 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {isSignUp ? "Creating account…" : "Signing in…"}
              </>
            ) : (
              <>
                <LogIn className="size-4" />
                {isSignUp ? "Create account" : "Sign in"}
              </>
            )}
          </button>
        </form>

        {/* Toggle Sign In / Sign Up */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
              setSuccessMessage(null);
            }}
            disabled={loading}
            className="font-bold text-brand hover:underline disabled:opacity-50"
          >
            {isSignUp ? "Sign in" : "Create account"}
          </button>
        </p>

        {/* Feature highlights */}
        <div className="mt-8 space-y-3 rounded-2xl border border-border bg-surface p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            What you get
          </p>
          <ul className="space-y-2">
            <li className="flex items-center gap-2 text-sm">
              <span className="grid size-5 place-items-center rounded-full bg-brand/10 text-[10px] font-bold text-brand">
                1
              </span>
              Sync favorites across all your devices
            </li>
            <li className="flex items-center gap-2 text-sm">
              <span className="grid size-5 place-items-center rounded-full bg-brand/10 text-[10px] font-bold text-brand">
                2
              </span>
              Earn reputation from accurate reports
            </li>
            <li className="flex items-center gap-2 text-sm">
              <span className="grid size-5 place-items-center rounded-full bg-brand/10 text-[10px] font-bold text-brand">
                3
              </span>
              Get notified about your favorite places
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
