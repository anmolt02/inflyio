import { NextResponse } from "next/server";

const TIERS = [
  [0, 1000, "Emerging", 10, 25],
  [1000, 5000, "Rising", 20, 35],
  [5000, 10000, "Developing", 30, 45],
  [10000, 50000, "Established", 40, 60],
  [50000, 100000, "Recognized", 50, 70],
  [100000, 500000, "Influencer", 60, 80],
  [500000, 1000000, "Major", 70, 85],
  [1000000, 5000000, "Power Creator", 80, 90],
  [5000000, 10000000, "Elite", 85, 93],
  [10000000, 30000000, "Superstar", 90, 96],
  [30000000, 100000000, "Global Icon", 94, 98],
  [100000000, Infinity, "Titan", 96, 99],
];

function getTier(subscribers: number) {
  for (const tier of TIERS) {
    const [min, max, label, scoreMin, scoreMax] = tier;
    if (subscribers >= min && subscribers < max) {
      return { min, max, label, scoreMin, scoreMax };
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