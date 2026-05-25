import { ShieldAlert } from "lucide-react";
import { isSupabaseConfigured } from "../lib/supabase";
import { useData } from "../lib/DataContext";

export function SetupNotice() {
  const { error, demoMode } = useData();
  if (!demoMode) return null;

  return (
    <section className="setup-notice">
      <ShieldAlert size={22} aria-hidden />
      <div>
        <strong>{isSupabaseConfigured ? "Supabase setup needs attention" : "Supabase is not configured yet"}</strong>
        <p>
          The app is showing safe demo records only. Add <code>VITE_SUPABASE_URL</code> and{" "}
          <code>VITE_SUPABASE_ANON_KEY</code>, run <code>supabase/schema.sql</code>, and invite allowed users before using this register for governance.
        </p>
        {error ? <p className="error-text">{error}</p> : null}
      </div>
    </section>
  );
}
