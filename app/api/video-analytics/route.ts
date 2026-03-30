import { NextRequest, NextResponse } from "next/server";

const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

function parseDuration(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (parseInt(m[1] ?? "0") * 3600) + (parseInt(m[2] ?? "0") * 60) + parseInt(m[3] ?? "0");
}

function getBadge(mult: number): "viral" | "strong" | "average" | "underperforming" {
  if (mult >= 3)   return "viral";
  if (mult >= 1.5) return "strong";
  if (mult >= 0.5) return "average";
  return "underperforming";
}

export interface VideoAnalyticsVideo {
  videoId: string;
  title: string;
  viewCount: number;
  likeCount: number | null;
  commentCount: number;
  publishedAt: string;
  durationSeconds: number;
  tags: string[];
  dayOfWeek: string;
  viewsPerDay: number;
  engagementRate: number;
  performanceMultiple: number;
  badge: "viral" | "strong" | "average" | "underperforming";
}

export interface ContentPatterns {
  bestUploadDay: string;
  bestUploadDayMultiple: number;
  optimalTitleLengthMin: number;
  optimalTitleLengthMax: number;
  tagDensityPercentDiff: number;
  tagDensityThreshold: number;
  uploadFrequencyDays: number;
  evergreenCount: number;
  viralOutlierTitle: string;
  viralOutlierMultiple: number;
}

export interface VideoAnalyticsResponse {
  channelId: string;
  channelName: string;
  channelThumbnail: string;
  subscribers: number;
  avgViewsPerDay: number;
  videoSampleSize: number;
  videos: VideoAnalyticsVideo[];
  contentPatterns: ContentPatterns;
  distribution: {
    viral: number;
    strong: number;
    average: number;
    underperforming: number;
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const channelId = searchParams.get("channelId")?.trim();

  if (!channelId)
    return NextResponse.json({ error: "channelId is required." }, { status: 400 });
  if (!/^UC[\w-]{22}$/.test(channelId))
    return NextResponse.json({ error: "Invalid channelId format." }, { status: 400 });

  const YT_KEY = process.env.YOUTUBE_API_KEY;
  if (!YT_KEY)
    return NextResponse.json({ error: "YouTube API key not configured." }, { status: 500 });

  try {
    // ── 1. Channel details + uploadsPlaylistId ────────────────────────────────
    const chRes  = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&id=${channelId}&key=${YT_KEY}`
    );
    const chData = await chRes.json();
    if (!chData.items?.length)
      return NextResponse.json({ error: "Channel not found." }, { status: 404 });

    const ch          = chData.items[0];
    const subscribers = parseInt(ch.statistics?.subscriberCount ?? "0");
    const uploadsId: string | undefined = ch.contentDetails?.relatedPlaylists?.uploads;
    const thumbs      = ch.snippet?.thumbnails;
    const channelThumbnail = thumbs?.high?.url ?? thumbs?.medium?.url ?? thumbs?.default?.url ?? "";
    const channelName: string = ch.snippet?.title ?? "";

    if (!uploadsId)
      return NextResponse.json({ error: "Could not find uploads playlist." }, { status: 404 });

    // ── 2. Last 30 video IDs ──────────────────────────────────────────────────
    const plRes  = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${uploadsId}&maxResults=30&key=${YT_KEY}`
    );
    const plData = await plRes.json();
    if (!plData.items?.length)
      return NextResponse.json({ error: "No videos found." }, { status: 404 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ids: string = plData.items.map((i: any) => i.contentDetails.videoId).join(",");

    // ── 3. Video stats + snippet + contentDetails (1 batch call) ─────────────
    const vRes  = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet,contentDetails&id=${ids}&key=${YT_KEY}`
    );
    const vData = await vRes.json();
    if (!vData.items?.length)
      return NextResponse.json({ error: "Could not fetch videos." }, { status: 404 });

    const now = Date.now();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawVideos = vData.items.map((v: any) => {
      const viewCount    = parseInt(v.statistics?.viewCount    ?? "0");
      const likeCount    = v.statistics?.likeCount != null ? parseInt(v.statistics.likeCount) : null;
      const commentCount = parseInt(v.statistics?.commentCount ?? "0");
      const publishedAt: string = v.snippet.publishedAt;
      const daysOld = Math.max(1, (now - new Date(publishedAt).getTime()) / 86400000);
      return {
        videoId:       v.id as string,
        title:         v.snippet.title as string,
        viewCount,
        likeCount,
        commentCount,
        publishedAt,
        durationSeconds: parseDuration(v.contentDetails?.duration ?? "PT0S"),
        tags:          (v.snippet?.tags ?? []) as string[],
        dayOfWeek:     DAYS[new Date(publishedAt).getDay()],
        viewsPerDay:   Math.round(viewCount / daysOld),
        engagementRate: viewCount > 0
          ? Math.round(((likeCount ?? 0) + commentCount) / viewCount * 10000) / 100
          : 0,
        daysOld,
      };
    });

    const sampleAvgViews = rawVideos.length > 0
      ? rawVideos.reduce((s: number, v: typeof rawVideos[0]) => s + v.viewCount, 0) / rawVideos.length
      : 0;
    const sampleAvgVPD = rawVideos.length > 0
      ? rawVideos.reduce((s: number, v: typeof rawVideos[0]) => s + v.viewsPerDay, 0) / rawVideos.length
      : 0;

    const videos: VideoAnalyticsVideo[] = rawVideos.map((v: typeof rawVideos[0]) => {
      const performanceMultiple = sampleAvgViews > 0
        ? Math.round((v.viewCount / sampleAvgViews) * 10) / 10
        : 1;
      return { ...v, performanceMultiple, badge: getBadge(performanceMultiple) };
    });

    // ── Content Patterns ──────────────────────────────────────────────────────

    // Best upload day
    const dayMap: Record<string, { total: number; count: number }> = {};
    videos.forEach(v => {
      if (!dayMap[v.dayOfWeek]) dayMap[v.dayOfWeek] = { total: 0, count: 0 };
      dayMap[v.dayOfWeek].total += v.viewCount;
      dayMap[v.dayOfWeek].count++;
    });
    let bestDay = "N/A", bestDayMult = 1, bestDayAvgViews = 0;
    Object.entries(dayMap).forEach(([day, s]) => {
      const avg = s.total / s.count;
      if (avg > bestDayAvgViews) { bestDayAvgViews = avg; bestDay = day; }
    });
    bestDayMult = sampleAvgViews > 0
      ? Math.round((bestDayAvgViews / sampleAvgViews) * 10) / 10
      : 1;

    // Optimal title length — from top 33% by views
    const sortedByViews = [...videos].sort((a, b) => b.viewCount - a.viewCount);
    const topThird      = sortedByViews.slice(0, Math.max(1, Math.floor(videos.length / 3)));
    const titleLens     = topThird.map(v => v.title.length);
    const optMin        = Math.min(...titleLens);
    const optMax        = Math.max(...titleLens);

    // Tag density impact
    const TAG_THRESH    = 8;
    const withTags      = videos.filter(v => v.tags.length >= TAG_THRESH);
    const withoutTags   = videos.filter(v => v.tags.length < TAG_THRESH);
    const avgWithTags   = withTags.length > 0
      ? withTags.reduce((s, v) => s + v.viewCount, 0) / withTags.length : 0;
    const avgWithout    = withoutTags.length > 0
      ? withoutTags.reduce((s, v) => s + v.viewCount, 0) / withoutTags.length
      : sampleAvgViews;
    const tagDiff       = avgWithout > 0
      ? Math.round(((avgWithTags - avgWithout) / avgWithout) * 100) : 0;

    // Upload frequency — last 10 videos
    const byDate  = [...videos].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    const r10     = byDate.slice(0, Math.min(10, byDate.length));
    let gapTotal  = 0;
    for (let i = 0; i < r10.length - 1; i++)
      gapTotal += (new Date(r10[i].publishedAt).getTime() - new Date(r10[i + 1].publishedAt).getTime()) / 86400000;
    const uploadFreqDays = r10.length > 1
      ? Math.round((gapTotal / (r10.length - 1)) * 10) / 10 : 0;

    // Evergreen: 90+ days old, viewsPerDay >= 50% of sample avg views/day
    const evergreenCount = videos.filter(v => {
      const d = (now - new Date(v.publishedAt).getTime()) / 86400000;
      return d >= 90 && v.viewsPerDay >= sampleAvgVPD * 0.5;
    }).length;

    // Viral outlier
    const top = sortedByViews[0];

    const distribution = {
      viral:           videos.filter(v => v.badge === "viral").length,
      strong:          videos.filter(v => v.badge === "strong").length,
      average:         videos.filter(v => v.badge === "average").length,
      underperforming: videos.filter(v => v.badge === "underperforming").length,
    };

    const payload: VideoAnalyticsResponse = {
      channelId,
      channelName,
      channelThumbnail,
      subscribers,
      avgViewsPerDay: Math.round(sampleAvgVPD),
      videoSampleSize: videos.length,
      videos,
      contentPatterns: {
        bestUploadDay:        bestDay,
        bestUploadDayMultiple: bestDayMult,
        optimalTitleLengthMin: optMin,
        optimalTitleLengthMax: optMax,
        tagDensityPercentDiff: tagDiff,
        tagDensityThreshold:   TAG_THRESH,
        uploadFrequencyDays:   uploadFreqDays,
        evergreenCount,
        viralOutlierTitle:     top?.title ?? "",
        viralOutlierMultiple:  top?.performanceMultiple ?? 1,
      },
      distribution,
    };

    return NextResponse.json(payload);

  } catch (err) {
    console.error("[video-analytics] Error:", err);
    return NextResponse.json({ error: "Failed to fetch video analytics." }, { status: 500 });
  }
}