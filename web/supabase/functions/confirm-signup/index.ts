// confirm-signup — Supabase Edge Function (Deno runtime).
// Runs AFTER email confirmation: mirrors the auth user into public.users with
// the role chosen at signup, and creates the org shell so NGO/company surfaces
// have an org_id immediately. Service-role key is server-side only (4.4: no
// secrets in the client; this function holds it via Supabase's runtime secret).
// Deploy: supabase functions deploy confirm-signup --no-verify-jwt is NOT used;
// instead this is wired as a DB trigger-free webhook from the auth hook
// "After Signup" (Supabase Auth → Hooks) OR invoked by the /auth/confirm page
// once session.user.email_confirmed_at is present.
// Deno deploy target: supabase/functions/confirm-signup/index.ts

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!; // server-side only
const ALLOWED_ROLES = new Set(["ngo", "company"]);

serve(async (req) => {
  try {
    const { userId } = await req.json();
    if (!userId) return new Response("missing userId", { status: 400 });

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const { data: userData, error: userErr } = await admin.auth.admin.getUserById(userId);
    if (userErr || !userData?.user) return new Response("user not found", { status: 404 });
    const user = userData.user;
    if (!user.email_confirmed_at) return new Response("email not confirmed", { status: 400 });

    const meta = (user.user_metadata ?? {}) as { role?: string; org_name?: string };
    const role = meta.role ?? "ngo";
    if (!ALLOWED_ROLES.has(role)) return new Response("invalid role", { status: 400 });

    // Idempotent mirror of users row.
    const { error: upsertErr } = await admin
      .from("users")
      .upsert(
        { id: user.id, email: user.email, role, email_confirmed_at: user.email_confirmed_at },
        { onConflict: "id" },
      );
    if (upsertErr) return new Response(`users mirror failed: ${upsertErr.message}`, { status: 500 });

    // Create org shell if none linked yet.
    const { data: existing } = await admin
      .from("users")
      .select("org_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!existing?.org_id) {
      const legalName = typeof meta.org_name === "string" && meta.org_name.trim() ? meta.org_name.trim() : "Unnamed organisation";
      const { data: org, error: orgErr } = await admin
        .from("organizations")
        .insert({ type: role, legal_name: legalName, display_name: legalName })
        .select("id")
        .single();
      if (orgErr) return new Response(`org create failed: ${orgErr.message}`, { status: 500 });
      await admin.from("users").update({ org_id: org.id }).eq("id", user.id);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(`error: ${(e as Error).message}`, { status: 500 });
  }
});
