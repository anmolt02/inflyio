import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client. SERVER ONLY.
 * Never import this from a "use client" file — the service role key
 * bypasses RLS and must never reach the browser bundle.
 *
 * Lazily constructed so a missing env var doesn't crash the Vercel build.
 */

let client: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "supabaseAdmin: missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  client = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return client;
}
