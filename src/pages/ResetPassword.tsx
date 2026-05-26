import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { KeyRound, Save } from "lucide-react";
import { describeSupabaseError, isSupabaseConfigured, supabase } from "../lib/supabase";

export function ResetPassword() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function validate() {
    if (!newPassword) return "New password is required.";
    if (!confirmPassword) return "Confirm password is required.";
    if (newPassword !== confirmPassword) return "Passwords must match.";
    if (newPassword.length < 8) return "Password must be at least 8 characters.";
    return "";
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!supabase) {
      setError("Supabase is not configured.");
      return;
    }

    setSaving(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) {
        setError(describeSupabaseError(updateError));
        return;
      }
      setNewPassword("");
      setConfirmPassword("");
      setMessage("Password updated successfully.");
      window.setTimeout(() => navigate("/login", { replace: true }), 1500);
    } catch (updateError) {
      setError(describeSupabaseError(updateError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="login-mark"><KeyRound size={30} /></div>
        <h1>Reset password</h1>
        <p className="private-note">Enter a new password for your AERO register account.</p>
        {!isSupabaseConfigured ? (
          <div className="setup-notice compact">Supabase is not configured.</div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label>
              New password
              <input
                autoComplete="new-password"
                minLength={8}
                onChange={(event) => setNewPassword(event.target.value)}
                required
                type="password"
                value={newPassword}
              />
            </label>
            <label>
              Confirm new password
              <input
                autoComplete="new-password"
                minLength={8}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                type="password"
                value={confirmPassword}
              />
            </label>
            {message ? <div className="success-banner" role="status">{message}</div> : null}
            {error ? <pre className="error-box">{error}</pre> : null}
            <button className="primary icon-text" disabled={saving} type="submit">
              <Save size={17} />{saving ? "Updating..." : "Update password"}
            </button>
          </form>
        )}
        <Link className="secondary icon-text test-button" to="/login">Back to login</Link>
      </section>
    </main>
  );
}
