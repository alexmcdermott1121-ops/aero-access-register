import { FormEvent, useState } from "react";
import { Navigate } from "react-router-dom";
import { KeyRound, Lock, Wifi } from "lucide-react";
import {
  describeSupabaseError,
  getMaskedSupabaseKey,
  isSupabaseConfigured,
  supabase,
  supabaseAnonKey,
  supabaseUrl,
} from "../lib/supabase";
import { useData } from "../lib/DataContext";

export function Login() {
  const { currentUser, demoMode, error } = useData();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState("");

  if (currentUser) return <Navigate to="/" replace />;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!supabase) {
      setMessage("Supabase is not configured. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Netlify.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) {
        setMessage(describeSupabaseError(loginError));
      }
    } catch (loginError) {
      setMessage(describeSupabaseError(loginError));
    } finally {
      setLoading(false);
    }
  }

  async function testConnection() {
    if (!supabase) {
      setConnectionMessage("Supabase is not configured. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Netlify.");
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

  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="login-mark"><KeyRound size={30} /></div>
        <h1>AERO Key & Access Register</h1>
        <p className="private-note"><Lock size={16} />Private register. Authorised users only.</p>
        <div className="debug-panel">
          <strong>Supabase runtime settings</strong>
          <span>URL: {supabaseUrl || "Missing VITE_SUPABASE_URL"}</span>
          <span>Anon key: {getMaskedSupabaseKey()}</span>
          <span>Configured: {isSupabaseConfigured ? "Yes" : "No"}</span>
          {!supabaseUrl || !supabaseAnonKey ? (
            <p className="error-text">
              Missing runtime environment variable{!supabaseUrl && !supabaseAnonKey ? "s" : ""}:{" "}
              {!supabaseUrl ? "VITE_SUPABASE_URL " : ""}
              {!supabaseAnonKey ? "VITE_SUPABASE_ANON_KEY" : ""}
            </p>
          ) : null}
        </div>
        {!isSupabaseConfigured ? (
          <div className="setup-notice compact">
            Add Supabase environment variables to enable secure login. In Netlify, set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then redeploy.
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label>
              Email
              <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
            </label>
            <label>
              Password
              <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required />
            </label>
            {message || error ? <pre className="error-box">{message || error}</pre> : null}
            <button className="primary" disabled={loading} type="submit">{loading ? "Signing in..." : "Sign in"}</button>
          </form>
        )}
        <button className="secondary icon-text test-button" disabled={testing || !isSupabaseConfigured} onClick={testConnection} type="button">
          <Wifi size={16} />{testing ? "Testing..." : "Test Supabase connection"}
        </button>
        {connectionMessage ? <pre className="debug-result">{connectionMessage}</pre> : null}
      </section>
    </main>
  );
}
