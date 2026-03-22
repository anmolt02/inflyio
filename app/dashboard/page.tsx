"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { YoutubeScoreResponse } from "@/app/api/youtube-score/route";

const C = {
  surface:    "rgba(255,255,255,0.03)",
  border:     "rgba(255,255,255,0.07)",
  borderMid:  "rgba(255,255,255,0.12)",
  blue:       "#60A5FA",
  blueDim:    "rgba(96,165,250,0.10)",
  blueBorder: "rgba(96,165,250,0.28)",
  blueGlow:   "0 0 22px rgba(96,165,250,0.15)",
  cyan:       "#67E8F9",
  green:      "#34D399",
  red:        "#F87171",
  textPri:    "#F1F5F9",
  textSec:    "#64748B",
  textMid:    "#94A3B8",
};

const TIER_CONFIG: Record<string, { color: string; bg: string; glow: string }> = {
  Titan:           { color: "#67E8F9", bg: "rgba(103,232,249,0.10)", glow: "0 0 20px rgba(103,232,249,0.18)" },
  "Global Icon":   { color: "#A78BFA", bg: "rgba(167,139,250,0.10)", glow: "0 0 20px rgba(167,139,250,0.18)" },
  Superstar:       { color: "#60A5FA", bg: "rgba(96,165,250,0.10)",  glow: "0 0 20px rgba(96,165,250,0.18)"  },
  Elite:           { color: "#67E8F9", bg: "rgba(103,232,249,0.08)", glow: "0 0 16px rgba(103,232,249,0.15)" },
  "Power Creator": { color: "#60A5FA", bg: "rgba(96,165,250,0.08)",  glow: "0 0 16px rgba(96,165,250,0.15)"  },
  Major:           { color: "#60A5FA", bg: "rgba(96,165,250,0.07)",  glow: "none" },
  Influencer:      { color: "#34D399", bg: "rgba(52,211,153,0.08)",  glow: "none" },
  Recognized:      { color: "#94A3B8", bg: "rgba(148,163,184,0.08)", glow: "none" },
  Established:     { color: "#64748B", bg: "rgba(100,116,139,0.08)", glow: "none" },
  Developing:      { color: "#64748B", bg: "rgba(100,116,139,0.06)", glow: "none" },
  Rising:          { color: "#475569", bg: "rgba(71,85,105,0.06)",   glow: "none" },
  Emerging:        { color: "#475569", bg: "rgba(71,85,105,0.06)",   glow: "none" },
};

function getTierStyle(tier: string) {
  return TIER_CONFIG[tier] ?? { color: C.blue, bg: C.blueDim, glow: C.blueGlow };
}

function ScoreRing({ score, tier }: { score: number; tier: string }) {
  const t    = getTierStyle(tier);
  const r    = 54;
  const circ = 2 * Math.PI * r;
  const pct  = Math.min(score, 100) / 100;
  return (
    <div style={{ position: "relative", width: "140px", height: "140px", margin: "0 auto" }}>
      <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="9" />
        <circle cx="70" cy="70" r={r} fill="none" stroke={t.color} strokeWidth="9" strokeLinecap="round"
          strokeDasharray={`${circ * pct} ${circ}`}
          style={{ transition: "stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "2rem", color: t.color, lineHeight: 1 }}>{score.toFixed(1)}</span>
        <span style={{ fontSize: "10px", color: C.textSec, marginTop: "3px", letterSpacing: ".1em" }}>SCORE</span>
      </div>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${C.border}` }}>
      <span style={{ fontSize: "12px", color: C.textSec }}>{label}</span>
      <span style={{ fontSize: "13px", color: C.textPri, fontFamily: "'DM Mono',monospace", fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
        <span style={{ fontSize: "12px", color: C.textMid }}>{label}</span>
        <span style={{ fontSize: "12px", color, fontFamily: "'DM Mono',monospace" }}>{value}%</span>
      </div>
      <div style={{ height: "3px", background: "rgba(255,255,255,0.06)", borderRadius: "4px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${value}%`, background: `linear-gradient(90deg,${color}60,${color})`, borderRadius: "4px", transition: "width 1s cubic-bezier(.4,0,.2,1)" }} />
      </div>
    </div>
  );
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export default function DashboardPage() {
  const [input, setInput]     = useState("");
  const [data, setData]       = useState<YoutubeScoreResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const analyze = async () => {
    if (!input.trim()) return;
    try {
      setLoading(true); setError(null); setData(null);
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user?.id ?? null;
      const url    = `/api/youtube-score?name=${encodeURIComponent(input.trim())}` + (userId ? `&userId=${userId}` : "");
      const res    = await fetch(url);
      const json   = await res.json();
      if (!res.ok || json.error) { setError(json.error ?? "Something went wrong"); return; }
      setData(json as YoutubeScoreResponse);
    } catch {
      setError("Failed to analyze channel. Check your connection.");
    } finally { setLoading(false); }
  };

  const ts = data ? getTierStyle(data.tier) : null;

  return (
    <>
      <style>{`
        @keyframes fade-up  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin      { to{transform:rotate(360deg)} }
        @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:.3} }
        .f1{animation:fade-up .45s ease both}
        .f2{animation:fade-up .45s .08s ease both}
        .f3{animation:fade-up .45s .16s ease both}
        .f4{animation:fade-up .45s .24s ease both}
        .sinput:focus{outline:none;border-color:${C.blueBorder}!important;box-shadow:${C.blueGlow}!important}
        .abtn{transition:opacity .15s,transform .1s}
        .abtn:hover:not(:disabled){opacity:.88}
        .abtn:active:not(:disabled){transform:scale(.98)}

        /* ── Responsive grid overrides ── */
        .results-grid {
          display: grid;
          grid-template-columns: 190px 1fr 1fr;
          gap: 14px;
        }
        .platform-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }
        .platform-stats { display: flex; gap: 24px; }

        @media (max-width: 900px) {
          .results-grid { grid-template-columns: 1fr 1fr !important; }
          .results-grid > :first-child { grid-column: 1 / -1; }
        }
        @media (max-width: 640px) {
          .results-grid { grid-template-columns: 1fr !important; }
          .results-grid > :first-child { grid-column: auto; }
          .platform-bar { flex-direction: column; align-items: flex-start !important; }
          .platform-stats { gap: 16px !important; flex-wrap: wrap; }
          .page-pad { padding: 20px 16px !important; }
          .search-row { flex-direction: column !important; }
          .search-row .abtn { width: 100% !important; justify-content: center; }
          .channel-header { flex-direction: column !important; align-items: flex-start !important; gap: 10px !important; }
        }
      `}</style>

      <div className="page-pad" style={{ padding: "32px 36px", maxWidth: "1080px", fontFamily: "'DM Mono',monospace", color: C.textPri }}>

        {/* Hero */}
        <div className="f1" style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: C.green, boxShadow: `0 0 8px ${C.green}`, display: "inline-block", animation: "pulse-dot 2s infinite" }} />
            <span style={{ fontSize: "10px", color: C.green, letterSpacing: ".12em", textTransform: "uppercase" }}>YouTube Analysis Live</span>
          </div>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "clamp(1.4rem, 4vw, 2rem)", letterSpacing: "-.025em", margin: 0, color: C.textPri }}>
            Creator{" "}
            <span style={{ background: `linear-gradient(90deg,${C.blue},${C.cyan})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Intelligence</span>
          </h1>
          <p style={{ fontSize: "12px", color: C.textSec, marginTop: "6px", maxWidth: "500px", lineHeight: 1.8 }}>
            AI-powered influence scoring for YouTube creators. Analyze performance and identify high-impact talent instantly.
          </p>
        </div>

        {/* Search */}
        <div className="f2" style={{ marginBottom: "28px" }}>
          <div style={{ fontSize: "10px", color: C.textSec, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: "10px" }}>
            Analyze a Channel
          </div>
          <div className="search-row" style={{ display: "flex", gap: "10px", alignItems: "stretch" }}>
            <div style={{ flex: 1, background: "rgba(15,20,30,0.7)", border: `1px solid ${C.borderMid}`, borderRadius: "10px", display: "flex", alignItems: "center", padding: "0 14px", gap: "10px" }}>
              <span style={{ color: C.textSec, fontSize: "13px", flexShrink: 0 }}>▶</span>
              <input
                type="text"
                placeholder="Enter YouTube channel name…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && analyze()}
                className="sinput"
                style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: C.textPri, fontSize: "13px", fontFamily: "'DM Mono',monospace", padding: "13px 0" }}
              />
            </div>
            <button onClick={analyze} disabled={loading} className="abtn"
              style={{ padding: "0 28px", borderRadius: "10px", background: `linear-gradient(135deg,${C.blue},#3B82F6)`, border: "none", color: "#07080C", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "13px", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.65 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", whiteSpace: "nowrap", flexShrink: 0, minHeight: "46px" }}>
              {loading
                ? <><span style={{ width: "13px", height: "13px", border: "2px solid rgba(0,0,0,.25)", borderTopColor: "#07080C", borderRadius: "50%", display: "inline-block", animation: "spin .7s linear infinite" }} />Analyzing…</>
                : "Analyze →"}
            </button>
          </div>
          {error && (
            <div style={{ marginTop: "10px", padding: "10px 14px", background: "rgba(248,113,113,.07)", border: "1px solid rgba(248,113,113,.2)", borderRadius: "8px", fontSize: "12px", color: C.red }}>
              ⚠ {error}
            </div>
          )}
        </div>

        {/* Results */}
        {data && ts && (
          <>
            {/* Channel header */}
            <div className="f3 channel-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div>
                <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "clamp(1rem,3vw,1.25rem)", margin: 0, color: C.textPri }}>{data.channelName}</h2>
                <span style={{ fontSize: "11px", color: C.textSec }}>YouTube · {data.channelId}</span>
              </div>
              <div style={{ padding: "7px 16px", borderRadius: "8px", background: ts.bg, border: `1px solid ${ts.color}40`, color: ts.color, fontSize: "11px", fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", boxShadow: ts.glow, whiteSpace: "nowrap" }}>
                {data.tier}
              </div>
            </div>

            {/* 3-col → 2-col → 1-col grid */}
            <div className="f4 results-grid" style={{ marginBottom: "14px" }}>

              {/* Score ring */}
              <div style={{ background: ts.bg, border: `1px solid ${ts.color}30`, borderRadius: "14px", padding: "24px 18px", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", boxShadow: ts.glow }}>
                <ScoreRing score={parseFloat(data.influenceScore)} tier={data.tier} />
                <span style={{ fontSize: "10px", color: ts.color, fontWeight: 600, letterSpacing: ".08em", textTransform: "uppercase" }}>{data.tier}</span>
              </div>

              {/* Channel stats */}
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "14px", padding: "20px 22px" }}>
                <div style={{ fontSize: "10px", color: C.textSec, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: "6px" }}>Channel Stats</div>
                <MetricRow label="Subscribers"      value={fmt(data.subscribers)} />
                <MetricRow label="Total Views"       value={fmt(data.totalViews)} />
                <MetricRow label="Videos"            value={data.videos.toLocaleString()} />
                <MetricRow label="Avg Views / Video" value={fmt(data.avgViews)} />
                <MetricRow label="Engagement Ratio"  value={data.engagementRatio} />
              </div>

              {/* Breakdown */}
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "14px", padding: "20px 22px", display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ fontSize: "10px", color: C.textSec, letterSpacing: ".1em", textTransform: "uppercase" }}>Performance Breakdown</div>
                <ScoreBar label="Scale Position"  value={data.scalePosition}    color={C.blue}  />
                <ScoreBar label="Consistency"     value={data.consistencyScore} color={C.green} />
                <ScoreBar label="Activity"        value={data.activityScore}    color={C.cyan}  />
                <div style={{ marginTop: "2px", padding: "11px 14px", background: C.blueDim, border: `1px solid ${C.blueBorder}`, borderRadius: "9px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "11px", color: C.textMid }}>Influence Score</span>
                  <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "1.3rem", color: C.blue }}>{parseFloat(data.influenceScore).toFixed(1)}</span>
                </div>
              </div>
            </div>

            {/* Platform bar */}
            <div className="platform-bar" style={{ background: "rgba(255,255,255,.018)", border: `1px solid ${C.border}`, borderRadius: "12px", padding: "14px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "7px", background: "rgba(255,68,68,.12)", display: "flex", alignItems: "center", justifyContent: "center", color: "#FF4444", fontSize: "12px" }}>▶</div>
                <div>
                  <div style={{ fontSize: "12px", fontFamily: "'Syne',sans-serif", fontWeight: 600 }}>YouTube</div>
                  <div style={{ fontSize: "10px", color: C.textSec }}>Active connection</div>
                </div>
              </div>
              <div className="platform-stats">
                {[{ l: "Subscribers", v: fmt(data.subscribers) }, { l: "Total Views", v: fmt(data.totalViews) }, { l: "Videos", v: data.videos.toLocaleString() }].map(({ l, v }) => (
                  <div key={l}>
                    <div style={{ fontSize: "10px", color: C.textSec }}>{l}</div>
                    <div style={{ fontSize: "13px", fontFamily: "'Syne',sans-serif", fontWeight: 700 }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {["Instagram", "X (Twitter)"].map((p) => (
                  <div key={p} style={{ padding: "6px 12px", borderRadius: "7px", background: "rgba(255,255,255,.03)", border: `1px solid ${C.border}`, fontSize: "11px", color: C.textSec }}>
                    {p} · soon
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Empty state */}
        {!data && !loading && (
          <div style={{ marginTop: "72px", textAlign: "center", color: C.textSec }}>
            <div style={{ fontSize: "32px", marginBottom: "14px", opacity: .25 }}>▶</div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "15px", color: C.textMid, marginBottom: "6px" }}>Search a YouTube channel to begin</div>
            <div style={{ fontSize: "12px" }}>Try: MrBeast · PewDiePie · Linus Tech Tips</div>
          </div>
        )}
      </div>
    </>
  );
}
