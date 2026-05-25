import { createClient } from "@supabase/supabase-js";

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export function getMaskedSupabaseKey() {
  if (!supabaseAnonKey) return "Missing";
  if (supabaseAnonKey.length <= 12) return `${supabaseAnonKey.slice(0, 3)}...masked`;
  return `${supabaseAnonKey.slice(0, 8)}...${supabaseAnonKey.slice(-6)}`;
}

export function describeSupabaseError(error: unknown) {
  if (!error) return "No error details were returned.";
  if (error instanceof Error) {
    const details = [
      `Message: ${error.message}`,
      `Name: ${error.name}`,
    ];
    const possibleError = error as Error & { code?: string; status?: number; details?: string; hint?: string };
    if (possibleError.code) details.push(`Code: ${possibleError.code}`);
    if (possibleError.status) details.push(`Status: ${possibleError.status}`);
    if (possibleError.details) details.push(`Details: ${possibleError.details}`);
    if (possibleError.hint) details.push(`Hint: ${possibleError.hint}`);
    return details.join("\n");
  }
  if (typeof error === "object") {
    const possibleError = error as { message?: string; name?: string; code?: string; status?: number; details?: string; hint?: string };
    return [
      possibleError.message ? `Message: ${possibleError.message}` : "",
      possibleError.name ? `Name: ${possibleError.name}` : "",
      possibleError.code ? `Code: ${possibleError.code}` : "",
      possibleError.status ? `Status: ${possibleError.status}` : "",
      possibleError.details ? `Details: ${possibleError.details}` : "",
      possibleError.hint ? `Hint: ${possibleError.hint}` : "",
      `Raw: ${JSON.stringify(error)}`,
    ].filter(Boolean).join("\n");
  }
  return String(error);
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;
