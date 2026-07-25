import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  Mail, 
  Lock, 
  User, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Eye,
  EyeOff,
  MailCheck,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";

export const Route = createFileRoute("/settings/account")({
  component: AccountPage,
});

// Create a Supabase client for auth operations
function getSupabaseAuth() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase not configured");
  return createClient(url, key);
}

// Call the delete-user Edge Function
async function deleteUserAccount(accessToken: string): Promise<{ success: boolean; error?: string }> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const response = await fetch(`${supabaseUrl}/functions/v1/delete-user`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify({}),
  });

  const data = await response.json();
  
  if (!response.ok) {
    return { success: false, error: data.error || "Failed to delete account" };
  }
  
  return { success: true };
}

function AccountPage() {
  const navigate = useNavigate();
  const { user, refreshSession, signOut } = useAuth();
  const [activeSection, setActiveSection] = useState<"display" | "email" | "password" | "delete" | null>(null);
  
  // Display name state
  const [displayName, setDisplayName] = useState("");
  const [displayNameLoading, setDisplayNameLoading] = useState(false);
  const [displayNameSuccess, setDisplayNameSuccess] = useState<string | null>(null);
  const [displayNameError, setDisplayNameError] = useState<string | null>(null);
  
  // Email state
  const [newEmail, setNewEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  
  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  
  // Delete account state
  const [deleteStep, setDeleteStep] = useState<"initial" | "confirm">("initial");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  // Initialize display name from user metadata
  useEffect(() => {
    if (user?.user_metadata?.display_name) {
      setDisplayName(user.user_metadata.display_name);
    }
  }, [user]);

  // Check if email is verified
  const isEmailVerified = !!user?.email_confirmed_at;

  const handleUpdateDisplayName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setDisplayNameError("Display name cannot be empty");
      return;
    }
    
    setDisplayNameLoading(true);
    setDisplayNameSuccess(null);
    setDisplayNameError(null);
    
    try {
      const supabase = getSupabaseAuth();
      const { error } = await supabase.auth.updateUser({
        data: { display_name: displayName.trim() }
      });
      
      if (error) throw error;
      
      setDisplayNameSuccess("Display name updated successfully!");
      await refreshSession();
    } catch (err: any) {
      setDisplayNameError(err.message || "Failed to update display name");
    } finally {
      setDisplayNameLoading(false);
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailLoading(true);
    setEmailSuccess(null);
    setEmailError(null);
    
    try {
      const supabase = getSupabaseAuth();
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      
      setEmailSuccess(`Verification email sent to ${newEmail}. Please check your inbox to confirm.`);
      setNewEmail("");
      await refreshSession();
    } catch (err: any) {
      setEmailError(err.message || "Failed to update email");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!user?.email) return;
    
    setResendLoading(true);
    try {
      const supabase = getSupabaseAuth();
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: user.email,
      });
      
      if (error) throw error;
      
      setEmailSuccess("Verification email resent! Please check your inbox.");
    } catch (err: any) {
      setEmailError(err.message || "Failed to resend verification email");
    } finally {
      setResendLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordSuccess(null);
    setPasswordError(null);
    
    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      setPasswordLoading(false);
      return;
    }
    
    // Validate password length
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      setPasswordLoading(false);
      return;
    }
    
    try {
      const supabase = getSupabaseAuth();
      
      // Re-authenticate first (best practice for password changes)
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password: currentPassword,
      });
      
      if (reauthError) {
        setPasswordError("Current password is incorrect");
        setPasswordLoading(false);
        return;
      }
      
      // Update password
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      
      setPasswordSuccess("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordError(err.message || "Failed to update password");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccountStep1 = () => {
    setDeleteStep("confirm");
    setDeleteError(null);
  };

  const handleCancelDelete = () => {
    setDeleteStep("initial");
    setDeleteConfirmText("");
    setDeleteError(null);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      setDeleteError("Please type DELETE to confirm");
      return;
    }
    
    setDeleteLoading(true);
    setDeleteError(null);
    
    try {
      const supabase = getSupabaseAuth();
      
      // Get current session to get access token for the Edge Function
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        setDeleteError("You must be signed in to delete your account");
        setDeleteLoading(false);
        return;
      }
      
      // Call the Edge Function to delete the account
      const result = await deleteUserAccount(session.access_token);
      
      if (!result.success) {
        setDeleteError(result.error || "Failed to delete account");
        setDeleteLoading(false);
        return;
      }
      
      // Account deleted successfully - show success state
      setDeleteSuccess(true);
      setDeleteLoading(false);
      
      // Sign out locally
      await signOut();
      
      // Navigate to home after a brief delay to show success message
      setTimeout(() => {
        navigate({ to: "/" });
      }, 2000);
      
    } catch (err: any) {
      setDeleteError(err.message || "Failed to process deletion request");
      setDeleteLoading(false);
    }
  };

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-surface/90 px-4 py-3 backdrop-blur">
        <Link 
          to="/settings" 
          className="grid size-9 place-items-center rounded-full bg-surface-muted"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Settings
          </p>
          <h1 className="text-lg font-extrabold tracking-tight">Manage Account</h1>
        </div>
      </header>

      {/* Content */}
      <main className="px-5 py-4">
        <div className="space-y-6">
          {/* Account Info */}
          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-center gap-3">
              <div className="grid size-12 place-items-center rounded-2xl bg-brand/10 text-brand">
                <User className="size-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">
                  {user?.user_metadata?.display_name || user?.email || "Account"}
                </p>
                <p className="text-xs text-muted-foreground truncate">{user?.email || "Not signed in"}</p>
              </div>
              {isEmailVerified ? (
                <div className="flex items-center gap-1 rounded-full bg-safe/10 px-2 py-1 text-[10px] font-medium text-safe">
                  <MailCheck className="size-3" />
                  Verified
                </div>
              ) : (
                <div className="flex items-center gap-1 rounded-full bg-caution/10 px-2 py-1 text-[10px] font-medium text-caution">
                  <AlertTriangle className="size-3" />
                  Unverified
                </div>
              )}
            </div>
          </div>

          {/* Display Name Section */}
          <div className="rounded-2xl border border-border bg-surface">
            <button
              onClick={() => setActiveSection(activeSection === "display" ? null : "display")}
              className="flex w-full items-center gap-3 px-4 py-4 text-left"
            >
              <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-muted text-muted-foreground">
                <User className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">Display Name</p>
                <p className="text-xs text-muted-foreground">How you appear to others</p>
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {user?.user_metadata?.display_name ? "Edit" : "Add"}
              </span>
            </button>
            
            {activeSection === "display" && (
              <div className="border-t border-border p-4">
                <form onSubmit={handleUpdateDisplayName} className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold">Display Name</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Enter your display name"
                      disabled={displayNameLoading}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:opacity-50"
                    />
                  </div>
                  
                  {displayNameSuccess && (
                    <div className="flex items-center gap-2 rounded-xl border border-safe/30 bg-safe/10 p-3 text-xs font-medium text-safe">
                      <CheckCircle className="size-4" />
                      {displayNameSuccess}
                    </div>
                  )}
                  
                  {displayNameError && (
                    <div className="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 p-3 text-xs font-medium text-danger">
                      <AlertCircle className="size-4" />
                      {displayNameError}
                    </div>
                  )}
                  
                  <button
                    type="submit"
                    disabled={displayNameLoading || !displayName.trim()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-2.5 text-sm font-bold text-brand-foreground disabled:opacity-50"
                  >
                    {displayNameLoading ? <Loader2 className="size-4 animate-spin" /> : null}
                    Save Display Name
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Email Section */}
          <div className="rounded-2xl border border-border bg-surface">
            <button
              onClick={() => setActiveSection(activeSection === "email" ? null : "email")}
              className="flex w-full items-center gap-3 px-4 py-4 text-left"
            >
              <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-muted text-muted-foreground">
                <Mail className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">Email Address</p>
                <p className="text-xs text-muted-foreground">
                  {user?.email || "No email set"}
                  {!isEmailVerified && " - Verification pending"}
                </p>
              </div>
              <span className={`text-xs font-medium ${isEmailVerified ? "text-safe" : "text-caution"}`}>
                {isEmailVerified ? "Verified" : "Unverified"}
              </span>
            </button>
            
            {activeSection === "email" && (
              <div className="border-t border-border p-4">
                {/* Email verification status */}
                {!isEmailVerified && (
                  <div className="mb-4 rounded-xl border border-caution/30 bg-caution/10 p-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-caution" />
                      <div>
                        <p className="text-xs font-semibold text-foreground">Email not verified</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Please verify your email to access all features.
                        </p>
                        <button
                          onClick={handleResendVerification}
                          disabled={resendLoading}
                          className="mt-2 flex items-center gap-1 text-xs font-semibold text-brand disabled:opacity-50"
                        >
                          {resendLoading ? <Loader2 className="size-3 animate-spin" /> : null}
                          Resend verification email
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                <form onSubmit={handleUpdateEmail} className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold">New Email Address</label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="Enter new email"
                      required
                      disabled={emailLoading}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:opacity-50"
                    />
                  </div>
                  
                  {emailSuccess && (
                    <div className="flex items-center gap-2 rounded-xl border border-safe/30 bg-safe/10 p-3 text-xs font-medium text-safe">
                      <CheckCircle className="size-4" />
                      {emailSuccess}
                    </div>
                  )}
                  
                  {emailError && (
                    <div className="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 p-3 text-xs font-medium text-danger">
                      <AlertCircle className="size-4" />
                      {emailError}
                    </div>
                  )}
                  
                  <button
                    type="submit"
                    disabled={emailLoading || !newEmail}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-2.5 text-sm font-bold text-brand-foreground disabled:opacity-50"
                  >
                    {emailLoading ? <Loader2 className="size-4 animate-spin" /> : null}
                    Send Verification
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Password Section */}
          <div className="rounded-2xl border border-border bg-surface">
            <button
              onClick={() => setActiveSection(activeSection === "password" ? null : "password")}
              className="flex w-full items-center gap-3 px-4 py-4 text-left"
            >
              <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-muted text-muted-foreground">
                <Lock className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">Change Password</p>
                <p className="text-xs text-muted-foreground">Update your account password</p>
              </div>
              <span className="text-xs font-medium text-muted-foreground">Change</span>
            </button>
            
            {activeSection === "password" && (
              <div className="border-t border-border p-4">
                <form onSubmit={handleUpdatePassword} className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold">Current Password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      required
                      disabled={passwordLoading}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:opacity-50"
                    />
                  </div>
                  
                  <div>
                    <label className="mb-1 block text-xs font-semibold">New Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password (min 6 characters)"
                        required
                        disabled={passwordLoading}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 pr-10 text-sm placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="mb-1 block text-xs font-semibold">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      required
                      disabled={passwordLoading}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:opacity-50"
                    />
                  </div>
                  
                  {passwordSuccess && (
                    <div className="flex items-center gap-2 rounded-xl border border-safe/30 bg-safe/10 p-3 text-xs font-medium text-safe">
                      <CheckCircle className="size-4" />
                      {passwordSuccess}
                    </div>
                  )}
                  
                  {passwordError && (
                    <div className="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 p-3 text-xs font-medium text-danger">
                      <AlertCircle className="size-4" />
                      {passwordError}
                    </div>
                  )}
                  
                  <button
                    type="submit"
                    disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-2.5 text-sm font-bold text-brand-foreground disabled:opacity-50"
                  >
                    {passwordLoading ? <Loader2 className="size-4 animate-spin" /> : null}
                    Update Password
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Delete Account Section */}
          <div className="rounded-2xl border border-danger/20 bg-danger/5">
            <button
              onClick={() => {
                setActiveSection(activeSection === "delete" ? null : "delete");
                setDeleteStep("initial");
                setDeleteSuccess(false);
              }}
              className="flex w-full items-center gap-3 px-4 py-4 text-left"
            >
              <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-danger/10 text-danger">
                <Lock className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-danger">Delete Account</p>
                <p className="text-xs text-muted-foreground">Permanently remove your account and data</p>
              </div>
            </button>
            
            {activeSection === "delete" && (
              <div className="border-t border-danger/20 p-4">
                {deleteSuccess ? (
                  /* Success State */
                  <div className="flex flex-col items-center py-4 text-center">
                    <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-safe/10">
                      <CheckCircle className="size-8 text-safe" />
                    </div>
                    <p className="mb-2 text-lg font-bold text-safe">Account Deleted</p>
                    <p className="text-sm text-muted-foreground">
                      Your account and all associated data have been permanently deleted. You will be redirected shortly.
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" />
                      Redirecting...
                    </div>
                  </div>
                ) : deleteStep === "initial" ? (
                  <>
                    {/* Warning message */}
                    <div className="rounded-xl border border-danger/20 bg-background p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-danger" />
                        <div className="space-y-2 text-sm">
                          <p className="font-semibold text-foreground">This action is permanent</p>
                          <p className="text-xs text-muted-foreground">
                            The following will be <span className="font-semibold text-danger">permanently deleted</span>:
                          </p>
                          <ul className="ml-4 list-disc text-xs text-muted-foreground">
                            <li>Your account and login credentials</li>
                            <li>All your favorites</li>
                            <li>All your wait time reports</li>
                            <li>Your reputation and badges</li>
                            <li>Profile information</li>
                          </ul>
                          <p className="mt-2 text-xs font-medium text-foreground">
                            This action cannot be undone.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={handleCancelDelete}
                        className="flex-1 rounded-xl border border-border bg-surface py-2.5 text-sm font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDeleteAccountStep1}
                        className="flex-1 rounded-xl bg-danger py-2.5 text-sm font-bold text-white"
                      >
                        Delete Account
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Final confirmation */}
                    <div className="rounded-xl border-2 border-danger/40 bg-danger/5 p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-danger" />
                        <div className="space-y-2">
                          <p className="font-bold text-danger">Final Confirmation</p>
                          <p className="text-xs text-muted-foreground">
                            Are you absolutely sure? Type <span className="font-bold text-danger">DELETE</span> to confirm you want to permanently delete your account.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <label className="mb-1 block text-xs font-semibold">
                        Type <span className="text-danger">DELETE</span> to confirm
                      </label>
                      <input
                        type="text"
                        value={deleteConfirmText}
                        onChange={(e) => {
                          setDeleteConfirmText(e.target.value.toUpperCase());
                          setDeleteError(null);
                        }}
                        placeholder="DELETE"
                        disabled={deleteLoading}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-mono placeholder:text-muted-foreground focus:border-danger focus:outline-none focus:ring-2 focus:ring-danger/20 disabled:opacity-50"
                      />
                    </div>
                    
                    {deleteError && (
                      <div className="mt-2 flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 p-3 text-xs font-medium text-danger">
                        <AlertCircle className="size-4" />
                        {deleteError}
                      </div>
                    )}
                    
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={handleCancelDelete}
                        disabled={deleteLoading}
                        className="flex-1 rounded-xl border border-border bg-surface py-2.5 text-sm font-semibold disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDeleteAccount}
                        disabled={deleteConfirmText !== "DELETE" || deleteLoading}
                        className="flex-1 rounded-xl bg-danger py-2.5 text-sm font-bold text-white disabled:opacity-50"
                      >
                        {deleteLoading ? (
                          <>
                            <Loader2 className="mr-2 inline size-4 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          "Delete My Account"
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
