import { NextRequest, NextResponse } from "next/server";
import { getUserId, getClientIp, hashIp, checkQuota } from "@/lib/usage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/usage
 * Returns the caller's remaining analyses so the UI can show
 * "3 of 5 analyses left this month" without guessing.
 *
 * Send the Supabase access token as a Bearer header from the client:
 *   const { data } = await supabase.auth.getSession()
 *   fetch("/api/usage", {
 *     headers: { Authorization: `Bearer ${data.session?.access_token}` }
 *   })
 */
export async function GET(req: NextRequest) {
  const userId = await getUserId(req);
  const ipHash = hashIp(getClientIp(req));

  // When Stripe lands, look the real plan up here instead of hardcoding.
  const plan: "free" | "pro" = "free";

  const q = await checkQuota(userId, ipHash, plan);

  return NextResponse.json({
    signedIn: Boolean(userId),
    plan,
    used: q.used,
    limit: q.limit,
    remaining: Math.max(0, q.limit - q.used),
    period: userId ? "month" : "day",
  });
}
