import { supabaseAdmin } from "./supabase-admin";

/**
 * Postgres-backed cache for YouTube API payloads.
 *
 * Why this exists: one analysis costs ~103 YouTube units and the daily
 * free quota is 10,000. That is ~97 analyses per DAY across the entire
 * product. Caching is not an optimisation here, it is the difference
 * between the site working and not working.
 */

export type CacheKind = "score" | "video-analytics" | "deep-dive";

/** How long each payload stays fresh, in hours. */
export const TTL_HOURS: Record<CacheKind, number> = {
  score: 12,
  "video-analytics": 12,
  "deep-dive": 24,
};

export function cacheKey(kind: CacheKind, target: string): string {
  return `${kind}:${target}`;
}

/**
 * Returns the cached payload if it exists and is still fresh, else null.
 * Never throws — a cache failure should degrade to a live fetch, not a 500.
 */
export async function getCached<T>(
  kind: CacheKind,
  target: string
): Promise<T | null> {
  try {
    const { data, error } = await supabaseAdmin()
      .from("api_cache")
      .select("payload, fetched_at")
      .eq("cache_key", cacheKey(kind, target))
      .maybeSingle();

    if (error || !data) return null;

    const ageMs = Date.now() - new Date(data.fetched_at).getTime();
    const ttlMs = TTL_HOURS[kind] * 60 * 60 * 1000;
    if (ageMs > ttlMs) return null;

    return data.payload as T;
  } catch {
    return null;
  }
}

/** Upsert a payload into the cache. Fire-and-forget; never throws. */
export async function setCached(
  kind: CacheKind,
  target: string,
  payload: unknown
): Promise<void> {
  try {
    await supabaseAdmin()
      .from("api_cache")
      .upsert(
        {
          cache_key: cacheKey(kind, target),
          payload,
          fetched_at: new Date().toISOString(),
        },
        { onConflict: "cache_key" }
      );
  } catch {
    /* cache write failures are non-fatal */
  }
}

/**
 * Serve a stale payload regardless of TTL. Used by the global circuit
 * breaker: when the daily YouTube quota is nearly gone, stale data beats
 * an error page.
 */
export async function getStale<T>(
  kind: CacheKind,
  target: string
): Promise<T | null> {
  try {
    const { data } = await supabaseAdmin()
      .from("api_cache")
      .select("payload")
      .eq("cache_key", cacheKey(kind, target))
      .maybeSingle();
    return (data?.payload as T) ?? null;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Channel ID lookup — the 100-unit call                               */
/* ------------------------------------------------------------------ */

function normaliseQuery(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Returns a known channelId for this search term, or null. Never expires. */
export async function lookupChannelId(query: string): Promise<string | null> {
  try {
    const { data } = await supabaseAdmin()
      .from("channel_lookup")
      .select("channel_id")
      .eq("query", normaliseQuery(query))
      .maybeSingle();
    return data?.channel_id ?? null;
  } catch {
    return null;
  }
}

/** Remember a search term → channelId mapping permanently. */
export async function saveChannelId(
  query: string,
  channelId: string,
  title?: string
): Promise<void> {
  try {
    await supabaseAdmin()
      .from("channel_lookup")
      .upsert(
        { query: normaliseQuery(query), channel_id: channelId, title },
        { onConflict: "query" }
      );
  } catch {
    /* non-fatal */
  }
}
