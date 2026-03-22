import { createClient } from "@supabase/supabase-js";

// ─── Validate env vars at module load time ─────────────────────────────────
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseUrl.startsWith("https://")) {
  throw new Error(
    `[supabase.ts] NEXT_PUBLIC_SUPABASE_URL is missing or malformed.\n` +
    `Expected: https://xxxx.supabase.co\n` +
    `Got: "${supabaseUrl}"`
  );
}

if (!supabaseAnonKey) {
  throw new Error("[supabase.ts] NEXT_PUBLIC_SUPABASE_ANON_KEY is missing.");
}

/**
 * Browser/client-side Supabase client.
 * Uses the ANON key — safe to expose in the browser.
 * Used for: supabase.auth.getSession(), supabase.auth.signIn(), etc.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
