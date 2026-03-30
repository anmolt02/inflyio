"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams }                            from "next/navigation";
import Link                                           from "next/link";
import type { VideoAnalyticsResponse, VideoAnalyticsVideo } from "@/app/api/video-analytics/route";
import type { VideoDeepDiveResponse }                       from "@/app/api/video-deep-dive/route";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  surface:    "rgba(255,255,255,0.03)",
  border:     "rgba(255,255,255,0.07)",
  borderMid:  "rgba(255,255,255,0.12)",
  blue:       "#60A5FA",
  blueDim:    "rgba(96,165,250,0.10)",
  blueBorder: "rgba(96,165,250,0.28)",
  green:      "#34D399",
  amber:      "#F59E0B",
  red:        "#F87171",
  textPri:    "#F1F5F9",
  textSec:    "#64748B",
  textMid:    "#94A3B8",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function timeAgo(dateStr: string): string {
  const d = Math.round((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (d < 7)   return `${d}d ago`;
  if (d < 30)  return `${Math.round(d / 7)}w ago`;
  if (d < 365) return `${Math.round(d / 30)}mo ago`;
  return `${Math.round(d / 365)}y ago`;
}

function dispVal(val: number, unit: string): string {
  if (!unit) return fmt(val);
  return `${Math.round(val * 100) / 100}${unit}`;
}

function badgeStyle(badge: string) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    viral:           { bg: "rgba(52,211,153,0.12)",  color: C.green,   label: "Viral"   },
    strong:          { bg: "rgba(96,165,250,0.12)",  color: C.blue,    label: "Strong"  },
    average:         { bg: "rgba(148,163,184,0.08)", color: C.textMid, label: "Average" },
    underperforming: { bg: "rgba(248,113,113,0.10)", color: C.red,     label: "Under"   },
  };
  return map[badge] ?? map.average;
}

function scoreColor(s: number) {
  if (s >= 70) return C.green;
  if (s >= 50) return C.blue;
  if (s >= 30) return C.amber;
  return C.red;
}

function factorColor(status: string) {
  if (status === "good")    return C.green;
  if (status === "neutral") return C.blue;
  return C.red;
}

// ─── Primitive components ─────────────────────────────────────────────────────
function Spinner({ size = 14 }: { size?: number }) {
  return (
    <span style={{
      width: `${size}px`, height: `${size}px`,
      border: "2px solid rgba(255,255,255,0.08)", borderTopColor: C.blue,
      borderRadius: "50%", display: "inline-block",
      animation: "spin .7s linear infinite",
    }} />
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: "14px", padding: "18px 20px", ...style,
    }}>
      {children}
    </div>
  );
}

function SectionLabel({ text, right }: { text: string; right?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
      <span style={{ fontSize: "10px", color: C.textSec, letterSpacing: ".1em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
        {text}
      </span>
      <div style={{ flex: 1, height: "1px", background: C.border }} />
      {right && <span style={{ fontSize: "10px", color: C.textSec, whiteSpace: "nowrap" }}>{right}</span>}
    </div>
  );
}

// ─── Growth chart ─────────────────────────────────────────────────────────────
function GrowthChart({ videos, avgViewsPerDay }: { videos: VideoAnalyticsVideo[]; avgViewsPerDay: number }) {
  const sorted  = [...videos].sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime());
  const maxVpd  = Math.max(...sorted.map(v => v.viewsPerDay), 1);

  return (
    <Card style={{ marginBottom: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
        <span style={{ fontSize: "11px", color: C.textMid }}>Views/day per video · oldest → newest</span>
        <div style={{ display: "flex", gap: "14px" }}>
          {[{ c: C.green, l: "Above avg" }, { c: C.blue, l: "Near avg" }, { c: C.amber, l: "Below avg" }].map(({ c, l }) => (
            <div key={l} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "1px", background: c, display: "inline-block" }} />
              <span style={{ fontSize: "10px", color: C.textSec }}>{l}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: "3px", height: "80px" }}>
        {sorted.map((v) => {
          const h     = Math.max(4, (v.viewsPerDay / maxVpd) * 80);
          const color = v.viewsPerDay >= avgViewsPerDay * 1.5 ? C.green
            : v.viewsPerDay >= avgViewsPerDay * 0.7 ? C.blue : C.amber;
          return (
            <div
              key={v.videoId}
              title={`${v.title}\n${fmt(v.viewsPerDay)} views/day`}
              style={{ flex: 1, height: `${h}px`, background: color, borderRadius: "2px 2px 0 0", opacity: 0.85, cursor: "default", minWidth: "3px" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "0.85"; }}
            />
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>
        {["30 videos ago", "15 videos ago", "Latest"].map(l => (
          <span key={l} style={{ fontSize: "10px", color: C.textSec }}>{l}</span>
        ))}
      </div>
    </Card>
  );
}

// ─── Content patterns ─────────────────────────────────────────────────────────
function ContentPatterns({ data }: { data: VideoAnalyticsResponse }) {
  const p = data.contentPatterns;
  const rows = [
    {
      label: "Best upload day",
      value: p.bestUploadDay,
      sub:   `${p.bestUploadDayMultiple}× avg views`,
      color: C.green,
    },
    {
      label: "Optimal title length",
      value: p.optimalTitleLengthMin === p.optimalTitleLengthMax
        ? `~${p.optimalTitleLengthMin} chars`
        : `${p.optimalTitleLengthMin}–${p.optimalTitleLengthMax} chars`,
      sub:   "from top 33% of videos",
      color: C.blue,
    },
    {
      label: `Tag density (${p.tagDensityThreshold}+ tags)`,
      value: p.tagDensityPercentDiff === 0
        ? "Inconclusive"
        : `${p.tagDensityPercentDiff > 0 ? "+" : ""}${p.tagDensityPercentDiff}% views`,
      sub:   p.tagDensityPercentDiff > 0
        ? "more views with more tags"
        : p.tagDensityPercentDiff < 0 ? "fewer views with more tags" : "not enough data",
      color: p.tagDensityPercentDiff > 0 ? C.green : p.tagDensityPercentDiff < -10 ? C.red : C.textMid,
    },
    {
      label: "Upload frequency",
      value: p.uploadFrequencyDays > 0 ? `Every ${p.uploadFrequencyDays}d` : "N/A",
      sub:   "avg gap between recent uploads",
      color: C.blue,
    },
    {
      label: "Evergreen videos",
      value: `${p.evergreenCount} / ${data.videoSampleSize}`,
      sub:   "90d+ old, still delivering views",
      color: p.evergreenCount > 0 ? C.green : C.textSec,
    },
    {
      label: "Viral outlier",
      value: `${p.viralOutlierMultiple}× avg`,
      sub:   p.viralOutlierTitle.length > 36
        ? p.viralOutlierTitle.slice(0, 36) + "…"
        : p.viralOutlierTitle,
      color: C.amber,
    },
  ];

  return (
    <Card>
      {rows.map((row, i) => (
        <div key={i} style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          padding: "9px 0",
          borderBottom: i < rows.length - 1 ? `1px solid ${C.border}` : "none",
        }}>
          <span style={{ fontSize: "11px", color: C.textMid, paddingRight: "8px", flexShrink: 0 }}>{row.label}</span>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "12px", fontWeight: 500, color: row.color, fontFamily: "'DM Mono',monospace" }}>{row.value}</div>
            <div style={{ fontSize: "10px", color: C.textSec, marginTop: "1px" }}>{row.sub}</div>
          </div>
        </div>
      ))}
    </Card>
  );
}

// ─── Performance distribution ─────────────────────────────────────────────────
function PerformanceDistribution({ dist, total }: { dist: VideoAnalyticsResponse["distribution"]; total: number }) {
  const rows = [
    { label: "Viral (3× avg+)",          count: dist.viral,           color: C.green   },
    { label: "Strong (1.5–3×)",          count: dist.strong,          color: C.blue    },
    { label: "Average (0.5–1.5×)",       count: dist.average,         color: C.textMid },
    { label: "Underperforming (<0.5×)",  count: dist.underperforming, color: C.red     },
  ];
  return (
    <Card>
      {rows.map((row, i) => (
        <div key={i} style={{ marginBottom: i < rows.length - 1 ? "16px" : 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "6px" }}>
            <span style={{ color: C.textMid }}>{row.label}</span>
            <span style={{ color: row.color }}>{row.count} video{row.count !== 1 ? "s" : ""}</span>
          </div>
          <div style={{ height: "4px", background: "rgba(255,255,255,0.06)", borderRadius: "4px" }}>
            <div style={{
              height: "100%",
              width: `${total > 0 ? (row.count / total) * 100 : 0}%`,
              background: row.color, borderRadius: "4px",
              transition: "width .8s cubic-bezier(.4,0,.2,1)",
            }} />
          </div>
        </div>
      ))}
    </Card>
  );
}

// ─── Video row ────────────────────────────────────────────────────────────────
function VideoRow({ video, rank, maxViews }: { video: VideoAnalyticsVideo; rank: number; maxViews: number }) {
  const bs   = badgeStyle(video.badge);
  const barW = maxViews > 0 ? (video.viewCount / maxViews) * 100 : 0;
  return (
    <a href={`https://youtube.com/watch?v=${video.videoId}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
      <div
        style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", borderRadius: "10px", background: C.surface, border: `1px solid ${C.border}`, marginBottom: "6px", cursor: "pointer", transition: "border-color .15s" }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.borderMid; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; }}
      >
        <span style={{ fontSize: "11px", color: C.textSec, width: "22px", textAlign: "right", flexShrink: 0 }}>{rank}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "12px", color: C.textPri, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: "5px" }}>{video.title}</div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ flex: 1, height: "3px", background: "rgba(255,255,255,0.06)", borderRadius: "3px" }}>
              <div style={{ height: "100%", width: `${barW}%`, background: bs.color, borderRadius: "3px" }} />
            </div>
            <span style={{ fontSize: "10px", color: C.textSec, whiteSpace: "nowrap" }}>{video.performanceMultiple}× avg</span>
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: "12px", color: C.textPri, fontWeight: 500 }}>{fmt(video.viewCount)}</div>
          <div style={{ fontSize: "10px", color: C.textSec }}>{timeAgo(video.publishedAt)}</div>
        </div>
        <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "5px", background: bs.bg, color: bs.color, whiteSpace: "nowrap", flexShrink: 0, border: `1px solid ${bs.color}30` }}>
          {bs.label}
        </span>
        <span style={{ fontSize: "10px", color: C.textSec, opacity: 0.4, flexShrink: 0 }}>↗</span>
      </div>
    </a>
  );
}

// ─── Deep dive result ─────────────────────────────────────────────────────────
function DeepDiveResult({ d }: { d: VideoDeepDiveResponse }) {
  const bs = badgeStyle(d.badge);
  const sc = scoreColor(d.videoScore);

  return (
    <>
      {/* Video header */}
      <Card style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
          {d.thumbnail
            ? <img src={d.thumbnail} alt={d.title} style={{ width: "120px", height: "68px", borderRadius: "8px", objectFit: "cover", flexShrink: 0, border: `1px solid ${C.border}` }} />
            : <div style={{ width: "120px", height: "68px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: C.textSec }}>▶</div>
          }
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "14px", color: C.textPri, marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {d.title}
            </div>
            <div style={{ fontSize: "11px", color: C.textSec, marginBottom: "8px" }}>
              {timeAgo(d.publishedAt)} · {d.duration} · {d.channelName}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "5px", background: bs.bg, color: bs.color, border: `1px solid ${bs.color}30` }}>{bs.label}</span>
              <span style={{ fontSize: "11px", color: C.textMid }}>{d.performanceMultiple}× channel average</span>
            </div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "2rem", color: sc, lineHeight: 1 }}>{d.videoScore}</div>
            <div style={{ fontSize: "10px", color: C.textSec }}>video score</div>
          </div>
        </div>
      </Card>

      {/* KPI mini cards */}
      <div className="kpi-mini-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "10px", marginBottom: "20px" }}>
        {[
          { label: "total views",    val: fmt(d.viewCount),               color: C.textPri },
          { label: "views / day",    val: fmt(d.viewsPerDay),             color: C.blue    },
          { label: "engagement",     val: `${d.engagementRate}%`,         color: d.engagementRate >= 5 ? C.green : d.engagementRate >= 2 ? C.blue : C.amber },
          { label: "likes",          val: fmt(d.likeCount ?? 0),          color: C.textMid },
        ].map(({ label, val, color }) => (
          <Card key={label} style={{ textAlign: "center", padding: "14px 12px" }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "1.3rem", color, marginBottom: "4px" }}>{val}</div>
            <div style={{ fontSize: "10px", color: C.textSec }}>{label}</div>
          </Card>
        ))}
      </div>

      {/* Comparison bars */}
      <SectionLabel text="vs Channel Average" />
      <Card style={{ marginBottom: "20px" }}>
        {d.comparisonBars.map((bar, i) => {
          const maxVal  = Math.max(bar.videoValue, bar.channelAvg, 0.001);
          const vPct    = (bar.videoValue / maxVal) * 78;
          const aPct    = (bar.channelAvg  / maxVal) * 78;
          const isGood  = bar.videoValue >= bar.channelAvg;
          return (
            <div key={i} style={{ marginBottom: i < d.comparisonBars.length - 1 ? "14px" : 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "11px", color: C.textMid, minWidth: "130px", flexShrink: 0 }}>{bar.label}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <div style={{ width: `${vPct}%`, height: "5px", background: isGood ? C.green : C.red, borderRadius: "3px", minWidth: "4px", transition: "width .6s" }} />
                    <span style={{ fontSize: "10px", color: isGood ? C.green : C.red, whiteSpace: "nowrap" }}>
                      {dispVal(bar.videoValue, bar.unit)} · this video
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: `${aPct}%`, height: "5px", background: "rgba(255,255,255,0.15)", borderRadius: "3px", minWidth: "4px" }} />
                    <span style={{ fontSize: "10px", color: C.textSec, whiteSpace: "nowrap" }}>
                      {dispVal(bar.channelAvg, bar.unit)} · channel avg
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </Card>

      {/* Factors + tags */}
      <div className="deep-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
        <div>
          <SectionLabel text="Performance Factors" />
          <Card>
            {d.performanceFactors.map((f, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "9px 0",
                borderBottom: i < d.performanceFactors.length - 1 ? `1px solid ${C.border}` : "none",
              }}>
                <span style={{ fontSize: "11px", color: C.textMid }}>{f.label}</span>
                <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                  <span style={{ fontSize: "12px", color: C.textPri, fontWeight: 500, fontFamily: "'DM Mono',monospace" }}>{f.value}</span>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: factorColor(f.status), display: "inline-block", flexShrink: 0 }} />
                </div>
              </div>
            ))}
          </Card>
        </div>
        <div>
          <SectionLabel text="Tags" right={d.tags.length > 0 ? `${d.tags.length} total` : undefined} />
          <Card style={{ minHeight: "120px" }}>
            {d.tags.length > 0 ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {d.tags.slice(0, 16).map((tag, i) => (
                  <span key={i} style={{ fontSize: "10px", padding: "3px 8px", borderRadius: "5px", background: C.blueDim, color: C.blue, border: `1px solid ${C.blueBorder}` }}>
                    {tag}
                  </span>
                ))}
                {d.tags.length > 16 && (
                  <span style={{ fontSize: "10px", padding: "3px 8px", borderRadius: "5px", background: "rgba(255,255,255,0.04)", color: C.textSec }}>
                    +{d.tags.length - 16} more
                  </span>
                )}
              </div>
            ) : (
              <span style={{ fontSize: "12px", color: C.textSec }}>No tags found for this video.</span>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div style={{ padding: "32px 36px", fontFamily: "'DM Mono',monospace", color: C.textPri }}>
      <div style={{ textAlign: "center", marginTop: "80px" }}>
        <div style={{ fontSize: "32px", opacity: 0.2, marginBottom: "16px" }}>▶</div>
        <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "15px", color: C.textMid, marginBottom: "8px" }}>
          No channel selected
        </div>
        <div style={{ fontSize: "12px", color: C.textSec, marginBottom: "20px" }}>
          Search for a channel first, then click "Full Video Analytics"
        </div>
        <Link href="/dashboard" style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          padding: "10px 20px", background: C.blueDim, border: `1px solid ${C.blueBorder}`,
          borderRadius: "9px", color: C.blue, fontSize: "13px", textDecoration: "none",
        }}>
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

// ─── Main content (requires Suspense for useSearchParams) ─────────────────────
function VideoAnalyticsContent() {
  const searchParams = useSearchParams();
  const channelId    = searchParams.get("channelId");
  const channelName  = searchParams.get("name") ?? "Channel";

  const [tab, setTab]               = useState<"channel" | "single">("channel");
  const [analytics, setAnalytics]   = useState<VideoAnalyticsResponse | null>(null);
  const [aLoading, setALoading]     = useState(false);
  const [aError, setAError]         = useState<string | null>(null);

  const [videoInput, setVideoInput] = useState("");
  const [deepDive, setDeepDive]     = useState<VideoDeepDiveResponse | null>(null);
  const [dLoading, setDLoading]     = useState(false);
  const [dError, setDError]         = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    if (!channelId) return;
    setALoading(true); setAError(null);
    try {
      const res  = await fetch(`/api/video-analytics?channelId=${encodeURIComponent(channelId)}`);
      const json = await res.json();
      if (!res.ok || json.error) { setAError(json.error ?? "Something went wrong."); return; }
      setAnalytics(json as VideoAnalyticsResponse);
    } catch {
      setAError("Failed to load analytics. Check your connection.");
    } finally { setALoading(false); }
  }, [channelId]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  const fetchDeepDive = async () => {
    if (!videoInput.trim()) return;
    setDLoading(true); setDError(null); setDeepDive(null);
    try {
      const res  = await fetch(`/api/video-deep-dive?videoId=${encodeURIComponent(videoInput.trim())}`);
      const json = await res.json();
      if (!res.ok || json.error) { setDError(json.error ?? "Something went wrong."); return; }
      setDeepDive(json as VideoDeepDiveResponse);
    } catch {
      setDError("Failed to analyse video. Check your connection.");
    } finally { setDLoading(false); }
  };

  if (!channelId) return <EmptyState />;

  const videosByDate = analytics
    ? [...analytics.videos].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    : [];
  const maxViews = videosByDate.length > 0 ? Math.max(...videosByDate.map(v => v.viewCount)) : 1;

  return (
    <>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg) } }
        @keyframes fade-up { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .va-content { animation: fade-up .4s ease both; }
        .vid-inp:focus { outline: none; border-color: rgba(96,165,250,0.35) !important; }
        @media (max-width: 900px) {
          .patterns-grid   { grid-template-columns: 1fr !important; }
          .deep-grid       { grid-template-columns: 1fr !important; }
          .kpi-mini-grid   { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 640px) {
          .va-pad          { padding: 20px 16px !important; }
          .deep-input-row  { flex-direction: column !important; }
          .deep-input-row button { width: 100% !important; justify-content: center !important; }
        }
      `}</style>

      <div className="va-pad" style={{ padding: "32px 36px", maxWidth: "1080px", fontFamily: "'DM Mono',monospace", color: C.textPri }}>

        {/* ── Back + channel header ──────────────────────────────────────── */}
        <div style={{ marginBottom: "24px" }}>
          <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "11px", color: C.textSec, textDecoration: "none", marginBottom: "16px" }}>
            ← Dashboard
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {analytics?.channelThumbnail
              ? <img src={analytics.channelThumbnail} alt={channelName} style={{ width: "44px", height: "44px", borderRadius: "50%", border: `2px solid ${C.blueBorder}`, objectFit: "cover", flexShrink: 0 }} />
              : <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: C.blueDim, border: `2px solid ${C.blueBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "18px", color: C.blue, flexShrink: 0 }}>
                  {channelName[0]?.toUpperCase()}
                </div>
            }
            <div>
              <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "1.3rem", margin: 0, color: C.textPri }}>{channelName}</h1>
              <span style={{ fontSize: "11px", color: C.textSec }}>
                Video Analytics · {analytics ? `${analytics.videoSampleSize} videos analysed` : "Loading…"}
              </span>
            </div>
          </div>
        </div>

        {/* ── Tab bar ────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: "4px", background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: "10px", padding: "4px", marginBottom: "24px", width: "fit-content" }}>
          {(["channel", "single"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "7px 18px", borderRadius: "7px", fontSize: "12px", fontWeight: 500,
                cursor: "pointer", transition: "all .15s", fontFamily: "'DM Mono',monospace",
                background: tab === t ? "rgba(96,165,250,0.15)" : "transparent",
                border:     tab === t ? `1px solid ${C.blueBorder}` : "1px solid transparent",
                color:      tab === t ? C.blue : C.textSec,
              }}
            >
              {t === "channel" ? "Channel Videos" : "Single Video Deep Dive"}
            </button>
          ))}
        </div>

        {/* ── CHANNEL VIDEOS TAB ─────────────────────────────────────────── */}
        {tab === "channel" && (
          <div className="va-content">
            {aLoading && (
              <div style={{ textAlign: "center", padding: "60px 0", color: C.textSec }}>
                <Spinner size={20} />
                <div style={{ marginTop: "12px", fontSize: "12px" }}>Loading video analytics…</div>
              </div>
            )}
            {aError && (
              <div style={{ padding: "14px 18px", background: "rgba(248,113,113,.07)", border: "1px solid rgba(248,113,113,.2)", borderRadius: "10px", fontSize: "12px", color: C.red, marginBottom: "16px" }}>
                ⚠ {aError}
              </div>
            )}
            {analytics && (
              <>
                <SectionLabel text="Growth Trajectory" right={`${analytics.videoSampleSize} videos`} />
                <GrowthChart videos={analytics.videos} avgViewsPerDay={analytics.avgViewsPerDay} />

                <div className="patterns-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "24px" }}>
                  <div>
                    <SectionLabel text="Content Patterns" />
                    <ContentPatterns data={analytics} />
                  </div>
                  <div>
                    <SectionLabel text="Performance Distribution" />
                    <PerformanceDistribution dist={analytics.distribution} total={analytics.videoSampleSize} />
                  </div>
                </div>

                <SectionLabel text="All Videos" right="Newest first · click to open on YouTube" />
                {videosByDate.map((v, i) => (
                  <VideoRow key={v.videoId} video={v} rank={i + 1} maxViews={maxViews} />
                ))}
              </>
            )}
          </div>
        )}

        {/* ── SINGLE VIDEO DEEP DIVE TAB ──────────────────────────────────── */}
        {tab === "single" && (
          <div className="va-content">
            <SectionLabel text="Paste any YouTube video URL or ID" />
            <div className="deep-input-row" style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
              <input
                className="vid-inp"
                type="text"
                placeholder="https://youtube.com/watch?v=...  or  video ID"
                value={videoInput}
                onChange={e => setVideoInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && fetchDeepDive()}
                maxLength={200}
                style={{
                  flex: 1, background: "rgba(15,20,30,0.7)", border: `1px solid ${C.borderMid}`,
                  borderRadius: "10px", color: C.textPri, fontFamily: "'DM Mono',monospace",
                  fontSize: "12px", padding: "12px 14px",
                }}
              />
              <button
                onClick={fetchDeepDive}
                disabled={dLoading || !videoInput.trim()}
                style={{
                  padding: "0 24px", borderRadius: "10px",
                  background: `linear-gradient(135deg,${C.blue},#3B82F6)`,
                  border: "none", color: "#07080C",
                  fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "13px",
                  cursor: (dLoading || !videoInput.trim()) ? "not-allowed" : "pointer",
                  opacity: (dLoading || !videoInput.trim()) ? 0.6 : 1,
                  display: "flex", alignItems: "center", gap: "8px",
                  whiteSpace: "nowrap", minHeight: "46px", flexShrink: 0,
                }}
              >
                {dLoading ? <><Spinner size={13} /> Analysing…</> : "Analyse →"}
              </button>
            </div>

            {dError && (
              <div style={{ padding: "12px 16px", background: "rgba(248,113,113,.07)", border: "1px solid rgba(248,113,113,.2)", borderRadius: "10px", fontSize: "12px", color: C.red, marginBottom: "16px" }}>
                ⚠ {dError}
              </div>
            )}

            {!deepDive && !dLoading && !dError && (
              <div style={{ textAlign: "center", padding: "50px 0", color: C.textSec }}>
                <div style={{ fontSize: "24px", opacity: 0.15, marginBottom: "12px" }}>▶</div>
                <div style={{ fontSize: "12px" }}>Paste a YouTube video link to get a full performance breakdown</div>
                <div style={{ fontSize: "11px", color: C.textSec, marginTop: "6px", opacity: 0.7 }}>Works with any public video — not just this channel</div>
              </div>
            )}

            {deepDive && <DeepDiveResult d={deepDive} />}
          </div>
        )}
      </div>
    </>
  );
}

// ─── Page export with Suspense ────────────────────────────────────────────────
export default function VideoAnalyticsPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "#07080C", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Mono',monospace", color: "#334155", fontSize: "13px", gap: "10px" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        <span style={{ width: "14px", height: "14px", border: "2px solid #1E293B", borderTopColor: "#60A5FA", borderRadius: "50%", display: "inline-block", animation: "spin .7s linear infinite" }} />
        Loading…
      </div>
    }>
      <VideoAnalyticsContent />
    </Suspense>
  );
}