export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ─── Validate env vars at startup — fail loudly, not silently ─────────────
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY ?? "";

if (!supabaseUrl.startsWith("https://") || !supabaseUrl.includes(".supabase.co")) {
  console.error(
    `[youtube-score] ❌ NEXT_PUBLIC_SUPABASE_URL looks wrong: "${supabaseUrl}"\n` +
    `It must be: https://[project-ref].supabase.co`
  );
}

// Server-side client — uses SERVICE_ROLE key, bypasses RLS.
// Never expose this key to the browser.
const supabase = createClient(supabaseUrl, serviceRoleKey);

// ─── Types ────────────────────────────────────────────────────────────────
interface Tier {
  min: number;
  max: number;
  label: string;
  scoreMin: number;
  scoreMax: number;
}

export interface YoutubeScoreResponse {
  tier: string;
  subscribers: number;
  totalViews: number;
  videos: number;
  avgViews: number;
  engagementRatio: string;
  scalePosition: number;
  consistencyScore: number;
  activityScore: number;
  influenceScore: string;
  channelName: string;
  channelId: string;
}

// ─── Tier table ───────────────────────────────────────────────────────────
const TIERS: Tier[] = [
  { min: 0,           max: 1_000,         label: "Emerging",     scoreMin: 10, scoreMax: 25 },
  { min: 1_000,       max: 5_000,         label: "Rising",       scoreMin: 20, scoreMax: 35 },
  { min: 5_000,       max: 10_000,        label: "Developing",   scoreMin: 30, scoreMax: 45 },
  { min: 10_000,      max: 50_000,        label: "Established",  scoreMin: 40, scoreMax: 60 },
  { min: 50_000,      max: 100_000,       label: "Recognized",   scoreMin: 50, scoreMax: 70 },
  { min: 100_000,     max: 500_000,       label: "Influencer",   scoreMin: 60, scoreMax: 80 },
  { min: 500_000,     max: 1_000_000,     label: "Major",        scoreMin: 70, scoreMax: 85 },
  { min: 1_000_000,   max: 5_000_000,     label: "Power Creator",scoreMin: 80, scoreMax: 90 },
  { min: 5_000_000,   max: 10_000_000,    label: "Elite",        scoreMin: 85, scoreMax: 93 },
  { min: 10_000_000,  max: 30_000_000,    label: "Superstar",    scoreMin: 90, scoreMax: 96 },
  { min: 30_000_000,  max: 100_000_000,   label: "Global Icon",  scoreMin: 94, scoreMax: 98 },
  { min: 100_000_000, max: Number.MAX_SAFE_INTEGER, label: "Titan", scoreMin: 96, scoreMax: 99 },
];

function getTier(subscribers: number): Tier | undefined {
  return TIERS.find((t) => subscribers >= t.min && subscribers < t.max);
}

// ─── Route handler ────────────────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const channelName = searchParams.get("name");
    const userId = searchParams.get("userId") ?? null;

    console.log("[youtube-score] name:", channelName, "| userId:", userId);

    // ── Guard: missing params ──────────────────────────────────────────────
    if (!channelName) {
      return NextResponse.json({ error: "Channel name is required" }, { status: 400 });
    }

    if (!YOUTUBE_API_KEY) {
      console.error("[youtube-score] ❌ YOUTUBE_API_KEY is not set.");
      return NextResponse.json({ error: "Server misconfiguration: missing YouTube API key" }, { status: 500 });
    }

    // ── Step 1: Search for the channel ────────────────────────────────────
    const searchRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search` +
      `?part=snippet&q=${encodeURIComponent(channelName)}&type=channel&maxResults=1&key=${YOUTUBE_API_KEY}`
    );

    // Guard: YouTube API might return non-JSON on key errors
    const searchText = await searchRes.text();
    let searchData: any;
    try {
      searchData = JSON.parse(searchText);
    } catch {
      console.error("[youtube-score] YouTube search returned non-JSON:", searchText.slice(0, 200));
      return NextResponse.json({ error: "YouTube API error — check your API key" }, { status: 502 });
    }

    if (!searchData.items || searchData.items.length === 0) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    const channelId: string = searchData.items[0].id.channelId;
    const resolvedName: string = searchData.items[0].snippet?.channelTitle ?? channelName;

    // ── Step 2: Fetch channel statistics ─────────────────────────────────
    const statsRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${YOUTUBE_API_KEY}`
    );

    const statsText = await statsRes.text();
    let statsData: any;
    try {
      statsData = JSON.parse(statsText);
    } catch {
      console.error("[youtube-score] YouTube stats returned non-JSON:", statsText.slice(0, 200));
      return NextResponse.json({ error: "YouTube API error — failed to fetch stats" }, { status: 502 });
    }

    if (!statsData.items || statsData.items.length === 0) {
      return NextResponse.json({ error: "Channel stats not found" }, { status: 404 });
    }

    const stats = statsData.items[0].statistics;

    // ── Step 3: Compute scores ────────────────────────────────────────────
    const subscribers   = parseInt(stats.subscriberCount ?? "0", 10);
    const totalViews    = parseInt(stats.viewCount ?? "0", 10);
    const videos        = Math.max(parseInt(stats.videoCount ?? "1", 10), 1);

    const avgViews        = totalViews / videos;
    const engagementRatio = subscribers > 0 ? Math.min(avgViews / subscribers, 1) : 0;

    const tier = getTier(subscribers);
    if (!tier) {
      return NextResponse.json({ error: "Could not determine creator tier" }, { status: 422 });
    }

    const { min, max, label, scoreMin, scoreMax } = tier;
    const safeMax          = max === Number.MAX_SAFE_INTEGER ? subscribers * 1.5 : max;
    const scalePosition    = (subscribers - min) / (safeMax - min);
    const consistencyScore = Math.min(Math.log10(videos + 1) / 4, 1);
    const activityScore    = Math.min(Math.log10(videos + 1) / 4, 1);

    const tierPerformance =
      0.4 * scalePosition +
      0.3 * engagementRatio +
      0.15 * consistencyScore +
      0.15 * activityScore;

    const finalScore = scoreMin + tierPerformance * (scoreMax - scoreMin);

    // ── Step 4: Insert into Supabase ──────────────────────────────────────
    if (userId) {
      console.log("[youtube-score] Inserting into Supabase — URL:", supabaseUrl.slice(0, 40));

      const { error: dbError } = await supabase.from("creators").insert({
        user_id:          userId,
        name:             resolvedName,
        platform:         "youtube",
        followers:        subscribers,
        posts:            videos,
        avg_views:        Math.round(avgViews),
        engagement_rate:  parseFloat(engagementRatio.toFixed(3)),
        influence_score:  parseFloat(finalScore.toFixed(2)),
        tier:             label,
      });

      if (dbError) {
        // Log but don't fail the request — score is still returned
        console.error("[youtube-score] ❌ Supabase insert error:", JSON.stringify(dbError));
      } else {
        console.log("[youtube-score] ✅ Supabase insert success");
      }
    } else {
      console.warn("[youtube-score] ⚠️  No userId provided — skipping DB insert");
    }

    // ── Step 5: Return response ───────────────────────────────────────────
    const response: YoutubeScoreResponse = {
      tier:             label,
      subscribers,
      totalViews,
      videos,
      avgViews:         Math.round(avgViews),
      engagementRatio:  engagementRatio.toFixed(3),
      scalePosition:    Math.round(scalePosition * 100),
      consistencyScore: Math.round(consistencyScore * 100),
      activityScore:    Math.round(activityScore * 100),
      influenceScore:   finalScore.toFixed(2),
      channelName:      resolvedName,
      channelId,
    };

    return NextResponse.json(response);

  } catch (err) {
    console.error("[youtube-score] Unhandled error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
