import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import {
  LogIn,
  Mail,
  Lock,
  Loader2,
  Eye,
  EyeOff,
  ArrowLeft,
} from "lucide-react";

export const Route = createFileRoute("/sign-in")({
  component: SignInPage,
});

function SignInPage() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setSuccessMessage(
          "Account created! Check your email to confirm your account."
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate({ to: "/profile" });
      }
    } catch (err) {
      setError((err as Error).message || "An error occurred");
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
          <div className="mb-4 rounded-xl border border-safe/30 bg-safe/10 p-4">
            <p className="text-sm font-medium text-safe">{successMessage}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 rounded-xl border border-danger/30 bg-danger/10 p-4">
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
                className="w-full rounded-xl border border-border bg-surface py-3 pl-10 pr-4 text-sm font-medium placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
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
                className="w-full rounded-xl border border-border bg-surface py-3 pl-10 pr-12 text-sm font-medium placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
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
            disabled={loading}
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
            className="font-bold text-brand hover:underline"
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
