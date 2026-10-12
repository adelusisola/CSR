// Supabase client — email + password auth with confirmation (Section 5), roles, RLS.
// Public anon key only; no service secrets in the client bundle (Section 4.4).
import { createClient, type Session } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase = createClient(
  url ?? "http://localhost:54321", // local dev fallback via `supabase start`
  anonKey ?? "public-anon-key-placeholder",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true, // email-confirmation links land on /auth/confirm with tokens in the URL
      // Sessions idle-expire at 24 hours server-side (Supabase project setting);
      // autosave lives in localStorage and survives expiry (UX law #3).
    },
  },
);

export type Role = "ngo" | "company" | "admin" | "super_admin";

export async function getActiveRole(): Promise<Role | null> {
  const { data } = await supabase.auth.getSession();
  const session = data.session as Session | null;
  if (!session) return null;
  if (!session.user.email_confirmed_at) return null; // confirmation required before roles apply
  const meta = session.user.user_metadata as { role?: Role } | undefined;
  return meta?.role ?? null;
}

export async function signUpWithEmail(
  email: string,
  password: string,
  role: Exclude<Role, "admin" | "super_admin">,
  orgName: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { role, org_name: orgName },
      emailRedirectTo: `${window.location.origin}/auth/confirm`,
    },
  });
  return { error: error ? "That email is already registered. Try logging in instead." : null };
}
