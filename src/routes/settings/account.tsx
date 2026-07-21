import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
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
} from "lucide-react";
import { AppShell } from "@/components/queueless/AppShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/settings/account")({
  component: AccountPage,
});

function AccountPage() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<"email" | "password" | "delete" | null>(null);
  
  // Email state
  const [newEmail, setNewEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  
  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  
  // Delete account state
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailLoading(true);
    setEmailSuccess(null);
    setEmailError(null);
    
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      
      setEmailSuccess(`Verification email sent to ${newEmail}. Please check your inbox to confirm.`);
      setNewEmail("");
    } catch (err: any) {
      setEmailError(err.message || "Failed to update email");
    } finally {
      setEmailLoading(false);
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
      // Re-authenticate first
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

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") return;
    
    if (!confirm("Are you absolutely sure? This action cannot be undone.")) return;
    
    setDeleteLoading(true);
    alert("Account deletion is processed manually. Please contact support@queueless.app to delete your account.");
    setDeleteLoading(false);
    setDeleteConfirmText("");
  };

  return (
    <AppShell>
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
              <div>
                <p className="text-sm font-semibold">Current Account</p>
                <p className="text-xs text-muted-foreground">{user?.email || "Not signed in"}</p>
              </div>
            </div>
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
                <p className="text-sm font-semibold">Update Email</p>
                <p className="text-xs text-muted-foreground">Change your account email address</p>
              </div>
              <span className={`text-xs font-medium ${user?.email ? "text-brand" : "text-muted-foreground"}`}>
                {user?.email ? "Set" : "Required"}
              </span>
            </button>
            
            {activeSection === "email" && (
              <div className="border-t border-border p-4">
                <form onSubmit={handleUpdateEmail} className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold">New Email</label>
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
              onClick={() => setActiveSection(activeSection === "delete" ? null : "delete")}
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
                <div className="rounded-xl border border-danger/20 bg-background p-3 text-xs text-muted-foreground">
                  <p className="mb-2 font-semibold text-foreground">This action cannot be undone.</p>
                  <p>All your data including favorites, reports, and account information will be permanently deleted.</p>
                </div>
                
                <div className="mt-3">
                  <label className="mb-1 block text-xs font-semibold">
                    Type <span className="text-danger">DELETE</span> to confirm
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                    placeholder="DELETE"
                    disabled={deleteLoading}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:border-danger focus:outline-none focus:ring-2 focus:ring-danger/20 disabled:opacity-50"
                  />
                </div>
                
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== "DELETE" || deleteLoading}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-danger py-2.5 text-sm font-bold text-white disabled:opacity-50"
                >
                  {deleteLoading ? <Loader2 className="size-4 animate-spin" /> : null}
                  Delete My Account
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </AppShell>
  );
}
