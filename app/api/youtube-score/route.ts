import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ─── Types ────────────────────────────────────────────────────────────────────

interface VideoData {
  videoId: string;
  title: string;
  viewCount: number;
  likeCount: number | null;
  commentCount: number;
  publishedAt: string;
}

export interface TopVideo {
  videoId: string;
  title: string;
  viewCount: number;
  likeCount: number | null;
  commentCount: number;
  publishedAt: string;
}

export interface YoutubeScoreResponse {
  channelId: string;
  channelName: string;
  channelThumbnail: string;
  subscribers: number;
  totalViews: number;
  videos: number;
  avgViews: number;
  engagementRatio: string;
  influenceScore: string;
  tier: string;
  scalePosition: number;
  consistencyScore: number;
  activityScore: number;
  realEngagementRate: number;
  uploadVelocity: number;
  momentumScore: number;
  viralCoefficient: number;
  audienceLoyaltyIndex: number;
  contentConsistency: number;
  videoSampleSize: number;
  topVideos: TopVideo[];
}

// ─── Tier table ───────────────────────────────────────────────────────────────

const TIERS = [
  { name: "Emerging",      min: 0,           max: 1_000,        scoreMin: 0,  scoreMax: 10  },
  { name: "Rising",        min: 1_000,        max: 5_000,        scoreMin: 10, scoreMax: 20  },
  { name: "Developing",    min: 5_000,        max: 25_000,       scoreMin: 20, scoreMax: 30  },
  { name: "Established",   min: 25_000,       max: 100_000,      scoreMin: 30, scoreMax: 40  },
  { name: "Recognized",    min: 100_000,      max: 250_000,      scoreMin: 40, scoreMax: 50  },
  { name: "Influencer",    min: 250_000,      max: 500_000,      scoreMin: 50, scoreMax: 60  },
  { name: "Major",         min: 500_000,      max: 1_000_000,    scoreMin: 60, scoreMax: 67  },
  { name: "Power Creator", min: 1_000_000,    max: 2_500_000,    scoreMin: 67, scoreMax: 74  },
  { name: "Elite",         min: 2_500_000,    max: 10_000_000,   scoreMin: 74, scoreMax: 82  },
  { name: "Superstar",     min: 10_000_000,   max: 25_000_000,   scoreMin: 82, scoreMax: 90  },
  { name: "Global Icon",   min: 25_000_000,   max: 100_000_000,  scoreMin: 90, scoreMax: 96  },
  { name: "Titan",         min: 100_000_000,  max: Infinity,     scoreMin: 96, scoreMax: 100 },
];

function getTier(subs: number) {
  return TIERS.find(t => subs >= t.min && subs < t.max) ?? TIERS[TIERS.length - 1];
}

function clamp(v: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, v));
}

// ─── KPI calculators ──────────────────────────────────────────────────────────

function calcRealEngagementRate(vids: VideoData[]): number {
  const valid = vids.filter(v => v.viewCount > 0);
  if (!valid.length) return 0;
  const rate = valid.reduce((sum, v) => {
    const likes = v.likeCount ?? 0;
    return sum + ((likes + v.commentCount) / v.viewCount * 100);
  }, 0) / valid.length;
  return Math.round(rate * 100) / 100;
}

function calcUploadVelocity(vids: VideoData[]): number {
  if (vids.length < 2) return 0;
  const sorted = [...vids].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
  const recent = sorted.slice(0, Math.min(10, sorted.length));
  let totalDays = 0;
  for (let i = 0; i < recent.length - 1; i++) {
    const diff =
      new Date(recent[i].publishedAt).getTime() -
      new Date(recent[i + 1].publishedAt).getTime();
    totalDays += diff / (1000 * 60 * 60 * 24);
  }
  return Math.round((totalDays / (recent.length - 1)) * 10) / 10;
}

function calcMomentumScore(vids: VideoData[]): number {
  if (vids.length < 3) return 100;
  const now = Date.now();

  // Normalise each video to views-per-day so age doesn't bias the score.
  // A video posted today competes on rate, not raw count.
  const withRate = vids.map(v => {
    const daysOld = Math.max(1, (now - new Date(v.publishedAt).getTime()) / (1000 * 60 * 60 * 24));
    return { ...v, viewsPerDay: v.viewCount / daysOld };
  });

  const sorted = [...withRate].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  const last5 = sorted.slice(0, Math.min(5, sorted.length));
  const rest  = sorted.slice(5);

  if (!rest.length) return 100; // not enough history to compare against

  const recentRate   = last5.reduce((s, v) => s + v.viewsPerDay, 0) / last5.length;
  const historicRate = rest.reduce((s, v) => s + v.viewsPerDay, 0)  / rest.length;

  if (historicRate === 0) return 100;

  // Cap at 500 to keep the number readable; anything above means rapid growth
  return Math.min(500, Math.round((recentRate / historicRate) * 100));
}

function calcViralCoefficient(vids: VideoData[]): number {
  const views = vids.map(v => v.viewCount).filter(v => v > 0);
  if (views.length < 2) return 1;
  const peak = Math.max(...views);
  const avg = views.reduce((a, b) => a + b, 0) / views.length;
  return avg === 0 ? 1 : Math.round((peak / avg) * 10) / 10;
}

function calcAudienceLoyaltyIndex(vids: VideoData[]): number {
  const valid = vids.filter(v => v.viewCount > 0);
  if (!valid.length) return 0;
  const idx =
    valid.reduce((s, v) => s + (v.commentCount / v.viewCount) * 1000, 0) / valid.length;
  return Math.round(idx * 100) / 100;
}

function calcContentConsistency(vids: VideoData[]): number {
  const views = vids.map(v => v.viewCount).filter(v => v > 0);
  if (views.length < 3) return 50;
  const avg = views.reduce((a, b) => a + b, 0) / views.length;
  if (avg === 0) return 50;
  const variance = views.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / views.length;
  const cv = Math.sqrt(variance) / avg;
  return Math.round(clamp(100 - cv * 50));
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name   = searchParams.get("name")?.trim();
  const userId = searchParams.get("userId") ?? null;

  if (!name) {
    return NextResponse.json({ error: "Channel name is required." }, { status: 400 });
  }

  const YT_KEY = process.env.YOUTUBE_API_KEY;
  if (!YT_KEY) {
    return NextResponse.json({ error: "YouTube API key not configured." }, { status: 500 });
  }

  try {
    // ── 1. Find channel ───────────────────────────────────────────────────────
    const searchRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(name)}&maxResults=1&key=${YT_KEY}`
    );
    const searchData = await searchRes.json();
    if (!searchData.items?.length) {
      return NextResponse.json({ error: `Channel "${name}" not found.` }, { status: 404 });
    }
    const channelId: string = searchData.items[0].snippet.channelId;

    // ── 2. Channel details + thumbnail + contentDetails ───────────────────────
    const channelRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&id=${channelId}&key=${YT_KEY}`
    );
    const channelData = await channelRes.json();
    if (!channelData.items?.length) {
      return NextResponse.json({ error: "Could not fetch channel details." }, { status: 404 });
    }

    const ch          = channelData.items[0];
    const stats       = ch.statistics;
    const subscribers = parseInt(stats.subscriberCount ?? "0");
    const totalViews  = parseInt(stats.viewCount ?? "0");
    const videoCount  = parseInt(stats.videoCount ?? "0");
    const avgViews    = videoCount > 0 ? Math.round(totalViews / videoCount) : 0;
    const uploadsId: string | undefined = ch.contentDetails?.relatedPlaylists?.uploads;

    // Best available thumbnail: high → medium → default
    const thumbs = ch.snippet?.thumbnails;
    const channelThumbnail: string =
      thumbs?.high?.url ?? thumbs?.medium?.url ?? thumbs?.default?.url ?? "";

    // ── 3. Fetch last 30 video IDs via uploads playlist ───────────────────────
    let videoData: VideoData[] = [];

    if (uploadsId) {
      const plRes = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${uploadsId}&maxResults=30&key=${YT_KEY}`
      );
      const plData = await plRes.json();

      if (plData.items?.length) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ids: string = plData.items.map((item: any) => item.contentDetails.videoId as string).join(",");

        // ── 4. Per-video stats + title ────────────────────────────────────────
        const vRes = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${ids}&key=${YT_KEY}`
        );
        const vData = await vRes.json();

        if (vData.items?.length) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          videoData = vData.items.map((v: any): VideoData => ({
            videoId:      v.id as string,
            title:        v.snippet.title as string,
            viewCount:    parseInt(v.statistics.viewCount    ?? "0"),
            likeCount:    v.statistics.likeCount != null ? parseInt(v.statistics.likeCount) : null,
            commentCount: parseInt(v.statistics.commentCount ?? "0"),
            publishedAt:  v.snippet.publishedAt as string,
          }));
        }
      }
    }

    // ── 5. Influence score ────────────────────────────────────────────────────
    const tier        = getTier(subscribers);
    const tierRange   = tier.max === Infinity ? tier.min * 10 : tier.max - tier.min;
    const posInTier   = clamp((subscribers - tier.min) / tierRange, 0, 1);
    const scalePos    = Math.round(posInTier * 100);

    const engRatio    = subscribers > 0 ? avgViews / subscribers : 0;
    const engScore    = Math.round(clamp(Math.log10(engRatio * 100 + 1) / Math.log10(101) * 100));

    const tierAvgVids = tier.min > 0 ? Math.log10(tier.min) * 50 : 10;
    const conScore    = Math.round(clamp(scalePos * 0.6 + engScore * 0.4));
    const actScore    = Math.round(clamp((videoCount / Math.max(tierAvgVids, 1)) * 100));

    const tierPerf = clamp(
      (scalePos * 0.40) / 100 +
      (engScore * 0.30) / 100 +
      (conScore * 0.15) / 100 +
      (actScore * 0.15) / 100
    );
    const finalScore = tier.scoreMin + tierPerf * (tier.scoreMax - tier.scoreMin);

    // ── 6. New KPIs ───────────────────────────────────────────────────────────
    const realEngagementRate   = calcRealEngagementRate(videoData);
    const uploadVelocity       = calcUploadVelocity(videoData);
    const momentumScore        = calcMomentumScore(videoData);
    const viralCoefficient     = calcViralCoefficient(videoData);
    const audienceLoyaltyIndex = calcAudienceLoyaltyIndex(videoData);
    const contentConsistency   = calcContentConsistency(videoData);

    // ── 7. Top 5 videos by view count ─────────────────────────────────────────
    const topVideos: TopVideo[] = [...videoData]
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, 5)
      .map(v => ({
        videoId:      v.videoId,
        title:        v.title,
        viewCount:    v.viewCount,
        likeCount:    v.likeCount,
        commentCount: v.commentCount,
        publishedAt:  v.publishedAt,
      }));

    // ── 8. Supabase insert ────────────────────────────────────────────────────
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    await supabase.from("creators").insert({
      user_id:         userId,
      name:            ch.snippet.title,
      platform:        "youtube",
      followers:       subscribers,
      posts:           videoCount,
      avg_views:       avgViews,
      engagement_rate: engRatio,
      influence_score: finalScore,
      tier:            tier.name,
    });

    // ── 9. Response ───────────────────────────────────────────────────────────
    const payload: YoutubeScoreResponse = {
      channelId,
      channelName:         ch.snippet.title,
      channelThumbnail,
      subscribers,
      totalViews,
      videos:              videoCount,
      avgViews,
      engagementRatio:     (engRatio * 100).toFixed(2) + "%",
      influenceScore:      finalScore.toFixed(1),
      tier:                tier.name,
      scalePosition:       scalePos,
      consistencyScore:    conScore,
      activityScore:       actScore,
      realEngagementRate,
      uploadVelocity,
      momentumScore,
      viralCoefficient,
      audienceLoyaltyIndex,
      contentConsistency,
      videoSampleSize:     videoData.length,
      topVideos,
    };

    return NextResponse.json(payload);

  } catch (err) {
    console.error("[youtube-score] Error:", err);
    return NextResponse.json({ error: "Failed to analyse channel." }, { status: 500 });
  }
}
