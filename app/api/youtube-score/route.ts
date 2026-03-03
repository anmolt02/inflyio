import { NextResponse } from "next/server";

type Tier = {
  min: number;
  max: number;
  label: string;
  scoreMin: number;
  scoreMax: number;
};

const TIERS: Tier[] = [
  { min: 0, max: 1000, label: "Emerging", scoreMin: 10, scoreMax: 25 },
  { min: 1000, max: 5000, label: "Rising", scoreMin: 20, scoreMax: 35 },
  { min: 5000, max: 10000, label: "Developing", scoreMin: 30, scoreMax: 45 },
  { min: 10000, max: 50000, label: "Established", scoreMin: 40, scoreMax: 60 },
  { min: 50000, max: 100000, label: "Recognized", scoreMin: 50, scoreMax: 70 },
  { min: 100000, max: 500000, label: "Influencer", scoreMin: 60, scoreMax: 80 },
  { min: 500000, max: 1000000, label: "Major", scoreMin: 70, scoreMax: 85 },
  { min: 1000000, max: 5000000, label: "Power Creator", scoreMin: 80, scoreMax: 90 },
  { min: 5000000, max: 10000000, label: "Elite", scoreMin: 85, scoreMax: 93 },
  { min: 10000000, max: 30000000, label: "Superstar", scoreMin: 90, scoreMax: 96 },
  { min: 30000000, max: 100000000, label: "Global Icon", scoreMin: 94, scoreMax: 98 },
  { min: 100000000, max: Number.MAX_SAFE_INTEGER, label: "Titan", scoreMin: 96, scoreMax: 99 },
];

function getTier(subscribers: number): Tier | null {
  for (const tier of TIERS) {
    if (subscribers >= tier.min && subscribers < tier.max) {
      return tier;
    }
  }
  return null;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const channelName = searchParams.get("name");

  if (!channelName) {
    return NextResponse.json({ error: "Channel name required" });
  }

  const API_KEY = process.env.YOUTUBE_API_KEY;

  // Search channel
  const searchRes = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
      channelName
    )}&type=channel&maxResults=1&key=${API_KEY}`
  );

  const searchData = await searchRes.json();

  if (!searchData.items || searchData.items.length === 0) {
    return NextResponse.json({ error: "Channel not found" });
  }

  const channelId = searchData.items[0].snippet.channelId;

  // Get stats
  const statsRes = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${API_KEY}`
  );

  const statsData = await statsRes.json();
  const stats = statsData.items[0].statistics;

  const subscribers = parseInt(stats.subscriberCount || "0");
  const views = parseInt(stats.viewCount || "0");
  const videos = parseInt(stats.videoCount || "1");

  const avgViews = views / videos;
  const engagementRatio =
    subscribers > 0 ? Math.min(avgViews / subscribers, 1) : 0;

  const tier = getTier(subscribers);
  if (!tier) return NextResponse.json({ error: "Tier error" });

  const { min, max, label, scoreMin, scoreMax } = tier;

  const scalePosition =
    max !== Infinity ? (subscribers - min) / (max - min) : 1;

  const consistencyScore = Math.min(Math.log10(videos + 1) / 4, 1);
  const activityScore = Math.min(Math.log10(videos + 1) / 4, 1);

  const tierPerformance =
    0.4 * scalePosition +
    0.3 * engagementRatio +
    0.15 * consistencyScore +
    0.15 * activityScore;

  const finalScore =
    scoreMin + tierPerformance * (scoreMax - scoreMin);

  return NextResponse.json({
    tier: label,
    subscribers,
    totalViews: views,
    videos,
    avgViews: Math.round(avgViews),
    engagementRatio: engagementRatio.toFixed(3),
    scalePosition: Math.round(scalePosition * 100),
    consistencyScore: Math.round(consistencyScore * 100),
    activityScore: Math.round(activityScore * 100),
    influenceScore: finalScore.toFixed(2),
  });
}