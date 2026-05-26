import { FormEvent, useState } from "react";
import { KeyRound, Save } from "lucide-react";
import { useData } from "../lib/DataContext";
import { describeSupabaseError, supabase } from "../lib/supabase";

export function Account() {
  const { currentUser } = useData();
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
    } catch (updateError) {
      setError(describeSupabaseError(updateError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <div className="page-heading">
        <div>
          <h1>Account</h1>
          <p>Manage your AERO register sign-in password.</p>
        </div>
      </div>

      <div className="account-panel">
        <div className="detail-item">
          <span>Signed in email</span>
          <strong>{currentUser?.email ?? "-"}</strong>
        </div>

        <form className="account-form" onSubmit={handleSubmit}>
          <h2><KeyRound size={18} />Change password</h2>
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
          <div className="form-actions">
            <button className="primary icon-text" disabled={saving} type="submit">
              <Save size={17} />{saving ? "Updating..." : "Update password"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
