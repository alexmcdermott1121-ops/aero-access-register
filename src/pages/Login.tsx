import { FormEvent, useState } from "react";
import { Navigate } from "react-router-dom";
import { KeyRound, Lock, Mail } from "lucide-react";
import {
  describeSupabaseError,
  isSupabaseConfigured,
  supabase,
} from "../lib/supabase";
import { useData } from "../lib/DataContext";

function cleanLoginError(error: unknown) {
  const text = describeSupabaseError(error).toLowerCase();
  if (text.includes("invalid login") || text.includes("invalid credentials") || text.includes("email not confirmed")) {
    return "Invalid email or password.";
  }
  if (text.includes("not authorised") || text.includes("not authorized") || text.includes("allowed_users")) {
    return "This email is not authorised to access this register. Please contact the register administrator.";
  }
  return "Unable to connect at the moment. Please try again shortly.";
}

export function Login() {
  const { currentUser } = useData();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const showDebug = new URLSearchParams(window.location.search).get("debug") === "true";

  if (currentUser) return <Navigate to="/" replace />;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!supabase) {
      setMessage("Unable to connect at the moment. Please try again shortly.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) {
        setMessage(cleanLoginError(loginError));
        return;
      }

      const { data: allowedUser, error: allowedError } = await supabase
        .from("allowed_users")
        .select("email")
        .eq("email", email.toLowerCase())
        .maybeSingle();

      if (allowedError) {
        setMessage(cleanLoginError(allowedError));
        await supabase.auth.signOut();
        return;
      }

      if (!allowedUser) {
        setMessage("This email is not authorised to access this register. Please contact the register administrator.");
        await supabase.auth.signOut();
      }
    } catch (loginError) {
      setMessage(cleanLoginError(loginError));
    } finally {
      setLoading(false);
    }
  }

  async function testConnection() {
    if (!supabase) {
      setConnectionMessage("Unable to connect at the moment.");
      return;
    }
    setTesting(true);
    setConnectionMessage("");
    try {
      const { data, error: testError, status, statusText } = await supabase
        .from("allowed_users")
        .select("email,role")
        .limit(1);

      if (testError) {
        setConnectionMessage(
          [
            "Supabase API was reached, but the test query returned an error.",
            `HTTP status: ${status}${statusText ? ` ${statusText}` : ""}`,
            describeSupabaseError(testError),
            "If you are not signed in yet, an RLS/auth error can be normal. A browser network error usually means URL, key, CORS, or project availability.",
          ].join("\n"),
        );
        return;
      }

      setConnectionMessage(`Supabase API connection succeeded. Test rows returned: ${data?.length ?? 0}.`);
    } catch (testError) {
      setConnectionMessage(
        [
          "Supabase API could not be reached by the browser.",
          describeSupabaseError(testError),
          "Check the Netlify environment variables, redeploy after saving them, and confirm the Supabase project URL is correct.",
        ].join("\n"),
      );
    } finally {
      setTesting(false);
    }
  }

  async function sendPasswordReset() {
    setResetMessage("");
    setMessage("");

    if (!email) {
      setMessage("Enter your email address first, then select Forgot password.");
      return;
    }

    if (!supabase) {
      setMessage("Unable to connect at the moment. Please try again shortly.");
      return;
    }

    setResetLoading(true);
    try {
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (resetError) {
        setMessage("Unable to connect at the moment. Please try again shortly.");
        return;
      }
      setResetMessage("Password reset email sent. Check your inbox.");
    } catch (resetError) {
      setMessage("Unable to connect at the moment. Please try again shortly.");
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="login-mark"><KeyRound size={30} /></div>
        <h1>AERO Key & Access Register</h1>
        <p className="private-note"><Lock size={16} />Private register. Authorised users only.</p>
        <form onSubmit={handleSubmit}>
          <label>
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
          </label>
          <label>
            Password
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required />
          </label>
          {message ? <pre className="error-box">{message}</pre> : null}
          {resetMessage ? <div className="success-banner" role="status">{resetMessage}</div> : null}
          <button className="primary" disabled={loading || !isSupabaseConfigured} type="submit">{loading ? "Signing in..." : "Sign in"}</button>
          <button className="link-button icon-text" disabled={resetLoading} onClick={() => void sendPasswordReset()} type="button">
            <Mail size={16} />{resetLoading ? "Sending reset email..." : "Forgot password?"}
          </button>
        </form>
      </section>
      {showDebug ? (
        <div className="debug-login-tools">
          <button className="debug-text-button" disabled={testing || !isSupabaseConfigured} onClick={testConnection} type="button">
            {testing ? "Testing..." : "Test connection"}
          </button>
          {connectionMessage ? <pre className="debug-result">{connectionMessage}</pre> : null}
        </div>
      ) : null}
    </main>
  );
}
