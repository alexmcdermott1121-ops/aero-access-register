import { FormEvent, useState } from "react";
import { Navigate } from "react-router-dom";
import { KeyRound, Lock } from "lucide-react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { useData } from "../lib/DataContext";

export function Login() {
  const { currentUser, demoMode, error } = useData();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  if (currentUser || demoMode) return <Navigate to="/" replace />;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setMessage(error.message);
  }

  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="login-mark"><KeyRound size={30} /></div>
        <h1>AERO Key & Access Register</h1>
        <p className="private-note"><Lock size={16} />Private register. Authorised users only.</p>
        {!isSupabaseConfigured ? (
          <div className="setup-notice compact">
            Add Supabase environment variables to enable secure login.
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
            {message || error ? <p className="error-text">{message || error}</p> : null}
            <button className="primary" disabled={loading} type="submit">{loading ? "Signing in..." : "Sign in"}</button>
          </form>
        )}
      </section>
    </main>
  );
}
