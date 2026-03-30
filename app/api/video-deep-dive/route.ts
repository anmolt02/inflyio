import { NextRequest, NextResponse } from "next/server";

const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

function extractVideoId(input: string): string | null {
  const s = input.trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  try {
    const url = new URL(s);
    if (url.searchParams.has("v"))            return url.searchParams.get("v");
    if (url.hostname === "youtu.be")          return url.pathname.slice(1, 12) || null;
    if (url.pathname.startsWith("/embed/"))   return url.pathname.split("/")[2] || null;
    if (url.pathname.startsWith("/shorts/"))  return url.pathname.split("/")[2] || null;
  } catch {}
  return null;
}

function parseDuration(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (parseInt(m[1] ?? "0") * 3600) + (parseInt(m[2] ?? "0") * 60) + parseInt(m[3] ?? "0");
}

function formatDuration(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  return `${m}:${String(s).padStart(2,"0")}`;
}

function getBadge(mult: number): "viral" | "strong" | "average" | "underperforming" {
  if (mult >= 3)   return "viral";
  if (mult >= 1.5) return "strong";
  if (mult >= 0.5) return "average";
  return "underperforming";
}

export interface ComparisonBar {
  label: string;
  videoValue: number;
  channelAvg: number;
  unit: string;
}

export interface PerformanceFactor {
  label: string;
  value: string;
  status: "good" | "neutral" | "poor";
}

export interface VideoDeepDiveResponse {
  videoId: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  duration: string;
  durationSeconds: number;
  viewCount: number;
  likeCount: number | null;
  commentCount: number;
  tags: string[];
  dayOfWeek: string;
  channelId: string;
  channelName: string;
  channelThumbnail: string;
  subscribers: number;
  viewsPerDay: number;
  engagementRate: number;
  likeRate: number;
  commentRate: number;
  performanceMultiple: number;
  badge: "viral" | "strong" | "average" | "underperforming";
  videoScore: number;
  channelAvgViews: number;
  channelAvgViewsPerDay: number;
  channelAvgEngagement: number;
  channelAvgLikeRate: number;
  channelAvgCommentRate: number;
  channelBestDay: string;
  channelOptimalTitleMin: number;
  channelOptimalTitleMax: number;
  channelAvgTagCount: number;
  comparisonBars: ComparisonBar[];
  performanceFactors: PerformanceFactor[];
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("videoId")?.trim();

  if (!raw)
    return NextResponse.json({ error: "videoId is required." }, { status: 400 });

  const videoId = extractVideoId(raw);
  if (!videoId)
    return NextResponse.json({ error: "Invalid YouTube video URL or ID." }, { status: 400 });

  const YT_KEY = process.env.YOUTUBE_API_KEY;
  if (!YT_KEY)
    return NextResponse.json({ error: "YouTube API key not configured." }, { status: 500 });

  try {
    // ── 1. Target video ───────────────────────────────────────────────────────
    const vRes  = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet,contentDetails&id=${videoId}&key=${YT_KEY}`
    );
    const vData = await vRes.json();
    if (!vData.items?.length)
      return NextResponse.json({ error: "Video not found or is private." }, { status: 404 });

    const vid          = vData.items[0];
    const channelId: string = vid.snippet.channelId;
    const viewCount    = parseInt(vid.statistics?.viewCount    ?? "0");
    const likeCount    = vid.statistics?.likeCount != null ? parseInt(vid.statistics.likeCount) : null;
    const commentCount = parseInt(vid.statistics?.commentCount ?? "0");
    const publishedAt: string = vid.snippet.publishedAt;
    const tags: string[]      = vid.snippet?.tags ?? [];
    const durationSeconds     = parseDuration(vid.contentDetails?.duration ?? "PT0S");
    const now     = Date.now();
    const daysOld = Math.max(1, (now - new Date(publishedAt).getTime()) / 86400000);
    const viewsPerDay    = Math.round(viewCount / daysOld);
    const engagementRate = viewCount > 0
      ? Math.round(((likeCount ?? 0) + commentCount) / viewCount * 10000) / 100 : 0;
    const likeRate    = viewCount > 0 ? Math.round((likeCount ?? 0) / viewCount * 10000) / 100 : 0;
    const commentRate = viewCount > 0 ? Math.round(commentCount / viewCount * 100000) / 1000 : 0;
    const dayOfWeek   = DAYS[new Date(publishedAt).getDay()];
    const thumbs      = vid.snippet?.thumbnails;
    const thumbnail   = thumbs?.maxres?.url ?? thumbs?.high?.url ?? thumbs?.medium?.url ?? thumbs?.default?.url ?? "";

    // ── 2. Channel details + uploadsPlaylistId ────────────────────────────────
    const chRes  = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&id=${channelId}&key=${YT_KEY}`
    );
    const chData = await chRes.json();
    if (!chData.items?.length)
      return NextResponse.json({ error: "Channel not found." }, { status: 404 });

    const ch           = chData.items[0];
    const subscribers  = parseInt(ch.statistics?.subscriberCount ?? "0");
    const channelName: string = ch.snippet?.title ?? "";
    const chThumbs     = ch.snippet?.thumbnails;
    const channelThumbnail = chThumbs?.high?.url ?? chThumbs?.medium?.url ?? chThumbs?.default?.url ?? "";
    const uploadsId: string | undefined = ch.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsId)
      return NextResponse.json({ error: "Could not get uploads playlist." }, { status: 404 });

    // ── 3. Last 30 channel video IDs ──────────────────────────────────────────
    const plRes  = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${uploadsId}&maxResults=30&key=${YT_KEY}`
    );
    const plData = await plRes.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cvIds: string = (plData.items ?? []).map((i: any) => i.contentDetails.videoId).join(",");

    // ── 4. Channel video stats for benchmarking ───────────────────────────────
    const cvRes  = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet,contentDetails&id=${cvIds}&key=${YT_KEY}`
    );
    const cvData = await cvRes.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const channelVideos = (cvData.items ?? []).map((v: any) => {
      const vc = parseInt(v.statistics?.viewCount ?? "0");
      const lc = v.statistics?.likeCount != null ? parseInt(v.statistics.likeCount) : null;
      const cc = parseInt(v.statistics?.commentCount ?? "0");
      const pub: string = v.snippet.publishedAt;
      const dOld = Math.max(1, (now - new Date(pub).getTime()) / 86400000);
      return {
        viewCount:    vc,
        likeCount:    lc,
        commentCount: cc,
        publishedAt:  pub,
        tags:         (v.snippet?.tags ?? []) as string[],
        titleLength:  (v.snippet?.title as string).length,
        dayOfWeek:    DAYS[new Date(pub).getDay()],
        viewsPerDay:  Math.round(vc / dOld),
        engagementRate: vc > 0 ? ((lc ?? 0) + cc) / vc * 100 : 0,
        likeRate:       vc > 0 ? (lc ?? 0) / vc * 100 : 0,
        commentRate:    vc > 0 ? cc / vc * 100 : 0,
      };
    });

    const n = channelVideos.length;
    const avg = <T extends number>(fn: (v: typeof channelVideos[0]) => T) =>
      n > 0 ? channelVideos.reduce((s: number, v: typeof channelVideos[0]) => s + fn(v), 0) / n : 0;

    const channelAvgViews       = Math.round(avg(v => v.viewCount));
    const channelAvgViewsPerDay = Math.round(avg(v => v.viewsPerDay));
    const channelAvgEngagement  = Math.round(avg(v => v.engagementRate) * 100) / 100;
    const channelAvgLikeRate    = Math.round(avg(v => v.likeRate) * 100) / 100;
    const channelAvgCommentRate = Math.round(avg(v => v.commentRate) * 1000) / 1000;
    const channelAvgTagCount    = Math.round(avg(v => v.tags.length));

    // Best upload day
    const dayMap: Record<string, { total: number; count: number }> = {};
    channelVideos.forEach((v: typeof channelVideos[0]) => {
      if (!dayMap[v.dayOfWeek]) dayMap[v.dayOfWeek] = { total: 0, count: 0 };
      dayMap[v.dayOfWeek].total += v.viewCount;
      dayMap[v.dayOfWeek].count++;
    });
    let channelBestDay = "N/A", bestDayAvg = 0;
    Object.entries(dayMap).forEach(([day, s]) => {
      const a = s.total / s.count;
      if (a > bestDayAvg) { bestDayAvg = a; channelBestDay = day; }
    });

    // Optimal title length
    const sortedByViews = [...channelVideos].sort((a, b) => b.viewCount - a.viewCount);
    const topThird      = sortedByViews.slice(0, Math.max(1, Math.floor(n / 3)));
    const titleLens     = topThird.map(v => v.titleLength);
    const channelOptimalTitleMin = Math.min(...titleLens);
    const channelOptimalTitleMax = Math.max(...titleLens);

    // Performance multiple + badge + score
    const performanceMultiple = channelAvgViews > 0
      ? Math.round((viewCount / channelAvgViews) * 10) / 10 : 1;
    const badge = getBadge(performanceMultiple);

    const engScore  = Math.min(100, (engagementRate / 10) * 100);
    const perfScore = Math.min(100, (performanceMultiple / 5) * 100);
    const velScore  = channelAvgViewsPerDay > 0
      ? Math.min(100, (viewsPerDay / channelAvgViewsPerDay) * 50) : 50;
    const videoScore = Math.round(engScore * 0.4 + perfScore * 0.4 + velScore * 0.2);

    const titleLen = (vid.snippet.title as string).length;

    const comparisonBars: ComparisonBar[] = [
      { label: "Views / day",     videoValue: viewsPerDay,     channelAvg: channelAvgViewsPerDay,  unit: ""  },
      { label: "Engagement rate", videoValue: engagementRate,  channelAvg: channelAvgEngagement,   unit: "%" },
      { label: "Like rate",       videoValue: likeRate,        channelAvg: channelAvgLikeRate,      unit: "%" },
      { label: "Comment rate",    videoValue: commentRate,     channelAvg: channelAvgCommentRate,   unit: "%" },
    ];

    const performanceFactors: PerformanceFactor[] = [
      {
        label: "Title length",
        value: `${titleLen} chars`,
        status: titleLen >= channelOptimalTitleMin && titleLen <= channelOptimalTitleMax ? "good"
          : (titleLen < 15 || titleLen > 100) ? "poor" : "neutral",
      },
      {
        label: "Upload day",
        value: dayOfWeek,
        status: dayOfWeek === channelBestDay ? "good" : "neutral",
      },
      {
        label: "Tag count",
        value: `${tags.length} tags`,
        status: tags.length >= 8 ? "good" : tags.length >= 4 ? "neutral" : "poor",
      },
      {
        label: "Duration",
        value: formatDuration(durationSeconds),
        status: durationSeconds >= 480 && durationSeconds <= 1200 ? "good"
          : durationSeconds >= 60  && durationSeconds <= 1800 ? "neutral" : "poor",
      },
    ];

    const payload: VideoDeepDiveResponse = {
      videoId, title: vid.snippet.title, thumbnail, publishedAt,
      duration: formatDuration(durationSeconds), durationSeconds,
      viewCount, likeCount, commentCount, tags, dayOfWeek,
      channelId, channelName, channelThumbnail, subscribers,
      viewsPerDay, engagementRate, likeRate, commentRate,
      performanceMultiple, badge, videoScore,
      channelAvgViews, channelAvgViewsPerDay, channelAvgEngagement,
      channelAvgLikeRate, channelAvgCommentRate,
      channelBestDay, channelOptimalTitleMin, channelOptimalTitleMax, channelAvgTagCount,
      comparisonBars, performanceFactors,
    };

    return NextResponse.json(payload);

  } catch (err) {
    console.error("[video-deep-dive] Error:", err);
    return NextResponse.json({ error: "Failed to analyse video." }, { status: 500 });
  }
}