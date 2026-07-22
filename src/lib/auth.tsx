import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import type { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount and listen for auth changes
  useEffect(() => {
    console.log("[Auth] Initializing auth provider...");

    // Get initial session
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        console.log("[Auth] Initial session check:", {
          hasSession: !!session,
          hasUser: !!session?.user,
          userEmail: session?.user?.email,
          emailConfirmed: !!session?.user?.email_confirmed_at,
        });
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      })
      .catch((error) => {
        console.error("[Auth] Error getting session:", error);
        setLoading(false);
      });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[Auth] Auth state changed:", {
        event,
        hasSession: !!session,
        userEmail: session?.user?.email,
        emailConfirmed: !!session?.user?.email_confirmed_at,
      });
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      console.log("[Auth] Cleaning up auth subscription");
      subscription.unsubscribe();
    };
  }, []);

  const refreshSession = useCallback(async () => {
    console.log("[Auth] Refreshing session...");
    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      console.error("[Auth] Error refreshing session:", error);
    } else {
      console.log("[Auth] Session refreshed:", {
        hasSession: !!data.session,
        userEmail: data.session?.user?.email,
      });
      setSession(data.session);
      setUser(data.session?.user ?? null);
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    console.log("[Auth] Attempting sign in:", email);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.log("[Auth] Sign in failed:", {
          error: error.message,
          status: error.status,
        });
        return { error };
      }

      console.log("[Auth] Sign in successful:", {
        userEmail: data.user?.email,
        emailConfirmed: !!data.user?.email_confirmed_at,
        hasSession: !!data.session,
      });

      return { error: null };
    } catch (err) {
      console.error("[Auth] Sign in exception:", err);
      return { error: err as AuthError };
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    console.log("[Auth] Attempting sign up:", email);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.log("[Auth] Sign up failed:", {
          error: error.message,
          status: error.status,
        });
        return { error };
      }

      console.log("[Auth] Sign up successful:", {
        userEmail: data.user?.email,
        emailConfirmed: !!data.user?.email_confirmed_at,
        needsConfirmation: !data.session, // No session means email confirmation is needed
      });

      return { error: null };
    } catch (err) {
      console.error("[Auth] Sign up exception:", err);
      return { error: err as AuthError };
    }
  }, []);

  const signOut = useCallback(async () => {
    console.log("[Auth] Signing out...");
    try {
      await supabase.auth.signOut();
      console.log("[Auth] Signed out successfully");
    } catch (err) {
      console.error("[Auth] Sign out error:", err);
    }
  }, []);

  const isAuthenticated = !!user && !!session;

  return (
    <AuthContext.Provider
      value={{ user, session, loading, isAuthenticated, signIn, signUp, signOut, refreshSession }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
