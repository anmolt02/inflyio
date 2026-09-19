import { createHash } from "crypto";
import { supabaseAdmin } from "./supabase-admin";
import type { CacheKind } from "./cache";

/**
 * Usage metering + rate limiting, backed by Postgres.
 *
 * IMPORTANT: do not replace this with an in-memory Map. Vercel runs each
 * route on a separate serverless instance, so module-scope counters reset
 * constantly and are not shared between instances. A rate limiter that
 * lives in RAM on Vercel does nothing.
 */

/* ------------------------------------------------------------------ */
/* Config — tune these, they are the whole business model              */
/* ------------------------------------------------------------------ */

export const LIMITS = {
  /** Anonymous visitors, per IP, per rolling 24h. */
  ANON_DAILY: 3,
  /** Signed-in free plan, per rolling 30 days. */
  FREE_MONTHLY: 5,
  /** Paid plan, per rolling 30 days. Wire this up when Stripe lands. */
  PRO_MONTHLY: 500,
  /** Burst guard: max requests per IP per minute, signed in or not. */
  BURST_PER_MINUTE: 8,
  /**
   * Circuit breaker. YouTube's daily free quota is 10,000 units.
   * Above this, we stop making live calls and serve stale cache only.
   */
  GLOBAL_DAILY_UNITS: 8500,
};

/** Approximate YouTube unit cost per action, for the circuit breaker. */
export const UNIT_COST: Record<CacheKind, number> = {
  score: 103, // search.list(100) + channels + playlistItems + videos
  "video-analytics": 4,
  "deep-dive": 4,
};

/** Cost when the channelId was already known (skips the 100-unit search). */
export const UNIT_COST_KNOWN_CHANNEL = 3;

/* ------------------------------------------------------------------ */
/* Identity                                                            */
/* ------------------------------------------------------------------ */

/**
 * Extract the client IP from a Next.js Request on Vercel.
 * x-forwarded-for is a comma-separated chain; the first entry is the client.
 */
export function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Hash the IP before storing it. Raw IPs are personal data under GDPR;
 * a salted hash gives you rate limiting without holding the identifier.
 */
export function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT ?? "inflyio-dev-salt-change-me";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

/**
 * Resolve the calling user from the Authorization header, if present.
 * Returns null for anonymous requests.
 */
export async function getUserId(req: Request): Promise<string | null> {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;

  try {
    const token = auth.slice(7);
    const { data, error } = await supabaseAdmin().auth.getUser(token);
    if (error) return null;
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Quota checks                                                        */
/* ------------------------------------------------------------------ */

export type QuotaResult = {
  allowed: boolean;
  reason?: "burst" | "anon_daily" | "free_monthly" | "global_quota";
  used: number;
  limit: number;
  /** Seconds until the caller should retry. */
  retryAfter?: number;
  /** True when the global breaker tripped — serve stale cache if we have it. */
  staleOnly?: boolean;
};

async function countSince(
  column: "user_id" | "ip_hash",
  value: string,
  sinceIso: string
): Promise<number> {
  const { count } = await supabaseAdmin()
    .from("usage_events")
    .select("id", { count: "exact", head: true })
    .eq(column, value)
    .gte("created_at", sinceIso);
  return count ?? 0;
}

function isoAgo(ms: number): string {
  return new Date(Date.now() - ms).toISOString();
}

const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;
const MONTH = 30 * DAY;

/**
 * Check whether this request is allowed. Call BEFORE doing any work.
 * Fails open (allows the request) if Supabase is unreachable — a metering
 * outage should not take the product down.
 */
export async function checkQuota(
  userId: string | null,
  ipHash: string,
  plan: "free" | "pro" = "free"
): Promise<QuotaResult> {
  try {
    // 1. Burst guard — applies to everyone, including signed-in users.
    const burst = await countSince("ip_hash", ipHash, isoAgo(MINUTE));
    if (burst >= LIMITS.BURST_PER_MINUTE) {
      return {
        allowed: false,
        reason: "burst",
        used: burst,
        limit: LIMITS.BURST_PER_MINUTE,
        retryAfter: 60,
      };
    }

    // 2. Global circuit breaker.
    const { data: unitsData } = await supabaseAdmin().rpc("units_used_today");
    const unitsToday = typeof unitsData === "number" ? unitsData : 0;
    if (unitsToday >= LIMITS.GLOBAL_DAILY_UNITS) {
      return {
        allowed: false,
        reason: "global_quota",
        used: unitsToday,
        limit: LIMITS.GLOBAL_DAILY_UNITS,
        staleOnly: true,
        retryAfter: 3600,
      };
    }

    // 3. Per-identity quota.
    if (!userId) {
      const used = await countSince("ip_hash", ipHash, isoAgo(DAY));
      return {
        allowed: used < LIMITS.ANON_DAILY,
        reason: used < LIMITS.ANON_DAILY ? undefined : "anon_daily",
        used,
        limit: LIMITS.ANON_DAILY,
        retryAfter: used < LIMITS.ANON_DAILY ? undefined : 3600,
      };
    }

    const limit = plan === "pro" ? LIMITS.PRO_MONTHLY : LIMITS.FREE_MONTHLY;
    const used = await countSince("user_id", userId, isoAgo(MONTH));
    return {
      allowed: used < limit,
      reason: used < limit ? undefined : "free_monthly",
      used,
      limit,
    };
  } catch {
    // Fail open.
    return { allowed: true, used: 0, limit: 0 };
  }
}

/* ------------------------------------------------------------------ */
/* Logging                                                             */
/* ------------------------------------------------------------------ */

/** Record one analysis. Call AFTER the work succeeds. Never throws. */
export async function logUsage(params: {
  userId: string | null;
  ipHash: string;
  action: CacheKind;
  target?: string;
  cached: boolean;
  units: number;
}): Promise<void> {
  try {
    await supabaseAdmin().from("usage_events").insert({
      user_id: params.userId,
      ip_hash: params.ipHash,
      action: params.action,
      target: params.target ?? null,
      cached: params.cached,
      units: params.cached ? 0 : params.units,
    });
  } catch {
    /* non-fatal */
  }
}

/* ------------------------------------------------------------------ */
/* Response helper                                                     */
/* ------------------------------------------------------------------ */

const MESSAGES: Record<NonNullable<QuotaResult["reason"]>, string> = {
  burst: "Too many requests. Wait a moment and try again.",
  anon_daily:
    "You've used your 3 free daily analyses. Create a free account to get more.",
  free_monthly:
    "You've used all 5 analyses on the Free plan this month. Upgrade to Pro for unlimited.",
  global_quota:
    "We're at today's data limit. Showing cached results where available — full analysis resumes shortly.",
};

/** Build a consistent 429 response from a failed quota check. */
export function quotaResponse(q: QuotaResult): Response {
  return new Response(
    JSON.stringify({
      error: q.reason ? MESSAGES[q.reason] : "Rate limit exceeded.",
      reason: q.reason,
      used: q.used,
      limit: q.limit,
      upgrade: q.reason === "free_monthly" || q.reason === "anon_daily",
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        ...(q.retryAfter ? { "Retry-After": String(q.retryAfter) } : {}),
        "X-RateLimit-Limit": String(q.limit),
        "X-RateLimit-Remaining": String(Math.max(0, q.limit - q.used)),
      },
    }
  );
}
