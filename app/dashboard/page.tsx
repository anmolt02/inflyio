"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { YoutubeScoreResponse } from "@/app/api/youtube-score/route";

// ─── Tier display config ──────────────────────────────────────────────────────
const TIER_CONFIG: Record<string, { color: string; bg: string; glow: string }> = {
  Titan:           { color: "#67E8F9", bg: "rgba(103,232,249,0.12)", glow: "0 0 20px rgba(103,232,249,0.2)" },
  "Global Icon":   { color: "#C084FC", bg: "rgba(192,132,252,0.12)", glow: "0 0 20px rgba(192,132,252,0.2)" },
  Superstar:       { color: "#F472B6", bg: "rgba(244,114,182,0.12)", glow: "0 0 20px rgba(244,114,182,0.2)" },
  Elite:           { color: "#FCD34D", bg: "rgba(252,211,77,0.12)",  glow: "0 0 20px rgba(252,211,77,0.2)"  },
  "Power Creator": { color: "#F5A623", bg: "rgba(245,166,35,0.12)",  glow: "0 0 20px rgba(245,166,35,0.2)"  },
  Major:           { color: "#F5A623", bg: "rgba(245,166,35,0.10)",  glow: "none" },
  Influencer:      { color: "#34D399", bg: "rgba(52,211,153,0.10)",  glow: "none" },
  Recognized:      { color: "#60A5FA", bg: "rgba(96,165,250,0.10)",  glow: "none" },
  Established:     { color: "#94A3B8", bg: "rgba(148,163,184,0.10)", glow: "none" },
  Developing:      { color: "#94A3B8", bg: "rgba(148,163,184,0.08)", glow: "none" },
  Rising:          { color: "#6B7280", bg: "rgba(107,114,128,0.08)", glow: "none" },
  Emerging:        { color: "#6B7280", bg: "rgba(107,114,128,0.08)", glow: "none" },
};

function getTierStyle(tier: string) {
  return TIER_CONFIG[tier] ?? { color: "#F5A623", bg: "rgba(245,166,35,0.10)", glow: "none" };
}

// ─── Score ring ───────────────────────────────────────────────────────────────
function ScoreRing({ score, tier }: { score: number; tier: string }) {
  const t = getTierStyle(tier);
  const r = 54;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(score, 100) / 100;

  return (
    <div style={{ position: "relative", width: "140px", height: "140px", margin: "0 auto" }}>
      <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
        <circle
          cx="70" cy="70" r={r} fill="none"
          stroke={t.color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${circ * pct} ${circ}`}
          style={{ transition: "stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{
          fontFamily: "'Syne', sans-serif", fontWeight: 800,
          fontSize: "2rem", color: t.color, lineHeight: 1,
        }}>
          {score.toFixed(1)}
        </span>
        <span style={{ fontSize: "10px", color: "#6B7280", marginTop: "2px", letterSpacing: ".08em" }}>
          SCORE
        </span>
      </div>
    </div>
  );
}

// ─── Metric row ───────────────────────────────────────────────────────────────
function MetricRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "9px 0",
      borderBottom: "1px solid rgba(255,255,255,0.05)",
    }}>
      <span style={{ fontSize: "12px", color: "#6B7280" }}>{label}</span>
      <span style={{
        fontSize: "13px", color: "#F9FAFB",
        fontFamily: "'DM Mono', monospace", fontWeight: 500,
      }}>
        {value}
      </span>
    </div>
  );
}

// ─── Score bar ────────────────────────────────────────────────────────────────
function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
        <span style={{ fontSize: "12px", color: "#9CA3AF" }}>{label}</span>
        <span style={{ fontSize: "12px", color, fontFamily: "'DM Mono', monospace" }}>{value}%</span>
      </div>
      <div style={{ height: "4px", background: "rgba(255,255,255,0.06)", borderRadius: "4px", overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${value}%`,
          background: `linear-gradient(90deg, ${color}80, ${color})`,
          borderRadius: "4px",
          transition: "width 1s cubic-bezier(.4,0,.2,1)",
        }} />
      </div>
    </div>
  );
}

// ─── Format helper ────────────────────────────────────────────────────────────
function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

// ─── Dashboard page ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [input, setInput]     = useState("");
  const [data, setData]       = useState<YoutubeScoreResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const analyze = async () => {
    if (!input.trim()) return;
    try {
      setLoading(true);
      setError(null);
      setData(null);

      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user?.id ?? null;

      const url =
        `/api/youtube-score?name=${encodeURIComponent(input.trim())}` +
        (userId ? `&userId=${userId}` : "");

      const res  = await fetch(url);
      const json = await res.json();

      if (!res.ok || json.error) {
        setError(json.error ?? "Something went wrong");
        return;
      }

      setData(json as YoutubeScoreResponse);
    } catch {
      setError("Failed to analyze channel. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const ts = data ? getTierStyle(data.tier) : null;

  return (
    <>
      {/* ── Styles ─────────────────────────────────────────────────────── */}
      <style>{`
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin        { to { transform: rotate(360deg); } }
        @keyframes pulse-dot   { 0%,100% { opacity: 1; } 50% { opacity: .3; } }

        .f1 { animation: fade-up .45s ease both; }
        .f2 { animation: fade-up .45s .1s ease both; }
        .f3 { animation: fade-up .45s .2s ease both; }
        .f4 { animation: fade-up .45s .3s ease both; }

        .sinput:focus {
          outline: none;
          border-color: rgba(245,166,35,.45) !important;
        }
        .abtn {
          transition: opacity .15s, transform .1s;
        }
        .abtn:hover:not(:disabled) { opacity: .88; }
        .abtn:active:not(:disabled) { transform: scale(.98); }
      `}</style>

      {/* ── Page wrapper ───────────────────────────────────────────────── */}
      <div style={{
        padding: "28px 32px",
        maxWidth: "1100px",
        fontFamily: "'DM Mono', monospace",
        color: "#F9FAFB",
      }}>

        {/* Hero ── */}
        <div className="f1" style={{ marginBottom: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <span style={{
              width: "7px", height: "7px", borderRadius: "50%",
              background: "#34D399", boxShadow: "0 0 8px #34D399",
              display: "inline-block",
              animation: "pulse-dot 2s infinite",
            }} />
            <span style={{
              fontSize: "10px", color: "#34D399",
              letterSpacing: ".1em", textTransform: "uppercase",
            }}>
              YouTube Analysis Live
            </span>
          </div>
          <h1 style={{
            fontFamily: "'Syne', sans-serif", fontWeight: 800,
            fontSize: "1.9rem", letterSpacing: "-.025em",
            margin: 0,
          }}>
            Creator{" "}
            <span style={{
              background: "linear-gradient(90deg, #F5A623, #FBBF24)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              Intelligence
            </span>
          </h1>
          <p style={{ fontSize: "12px", color: "#4B5563", marginTop: "5px", maxWidth: "480px" }}>
            AI-powered influence scoring for YouTube creators. Analyze performance
            and identify high-impact talent instantly.
          </p>
        </div>

        {/* Search ── */}
        <div className="f2" style={{
          background: "rgba(255,255,255,.025)",
          border: "1px solid rgba(255,255,255,.07)",
          borderRadius: "14px",
          padding: "20px",
          marginBottom: "24px",
        }}>
          <div style={{ display: "flex", gap: "12px" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <span style={{
                position: "absolute", left: "14px", top: "50%",
                transform: "translateY(-50%)",
                color: "#4B5563", fontSize: "14px", pointerEvents: "none",
              }}>
                ▶
              </span>
              <input
                type="text"
                placeholder="Enter YouTube channel name…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && analyze()}
                className="sinput"
                style={{
                  width: "100%",
                  padding: "12px 14px 12px 36px",
                  borderRadius: "10px",
                  background: "rgba(0,0,0,.4)",
                  border: "1px solid rgba(255,255,255,.09)",
                  color: "#F9FAFB",
                  fontSize: "13px",
                  fontFamily: "'DM Mono', monospace",
                  transition: "border-color .2s",
                }}
              />
            </div>
            <button
              onClick={analyze}
              disabled={loading}
              className="abtn"
              style={{
                padding: "12px 28px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #F5A623, #C97B00)",
                border: "none",
                color: "#07070A",
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                fontSize: "13px",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
                display: "flex", alignItems: "center", gap: "8px",
                whiteSpace: "nowrap",
              }}
            >
              {loading ? (
                <>
                  <span style={{
                    width: "14px", height: "14px",
                    border: "2px solid rgba(0,0,0,.3)",
                    borderTopColor: "#07070A",
                    borderRadius: "50%",
                    display: "inline-block",
                    animation: "spin .7s linear infinite",
                  }} />
                  Analyzing…
                </>
              ) : "Analyze →"}
            </button>
          </div>

          {error && (
            <div style={{
              marginTop: "12px", padding: "10px 14px",
              background: "rgba(248,113,113,.08)",
              border: "1px solid rgba(248,113,113,.2)",
              borderRadius: "8px",
              fontSize: "12px", color: "#F87171",
            }}>
              ⚠ {error}
            </div>
          )}
        </div>

        {/* Results ── */}
        {data && ts && (
          <>
            {/* Channel header */}
            <div className="f3" style={{
              display: "flex", alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "18px",
            }}>
              <div>
                <h2 style={{
                  fontFamily: "'Syne', sans-serif", fontWeight: 800,
                  fontSize: "1.3rem", margin: 0,
                }}>
                  {data.channelName}
                </h2>
                <span style={{ fontSize: "11px", color: "#4B5563" }}>
                  YouTube · {data.channelId}
                </span>
              </div>
              <div style={{
                padding: "8px 16px", borderRadius: "8px",
                background: ts.bg,
                border: `1px solid ${ts.color}44`,
                color: ts.color,
                fontSize: "12px", fontWeight: 600,
                boxShadow: ts.glow,
              }}>
                {data.tier}
              </div>
            </div>

            {/* 3-col results grid */}
            <div className="f4" style={{
              display: "grid",
              gridTemplateColumns: "200px 1fr 1fr",
              gap: "16px",
              marginBottom: "16px",
            }}>

              {/* Score ring */}
              <div style={{
                background: ts.bg,
                border: `1px solid ${ts.color}33`,
                borderRadius: "14px",
                padding: "24px 20px",
                display: "flex", flexDirection: "column",
                alignItems: "center", gap: "12px",
                boxShadow: ts.glow,
              }}>
                <ScoreRing score={parseFloat(data.influenceScore)} tier={data.tier} />
                <span style={{
                  fontSize: "11px", color: ts.color,
                  fontWeight: 600, letterSpacing: ".06em",
                }}>
                  {data.tier.toUpperCase()}
                </span>
              </div>

              {/* Channel stats */}
              <div style={{
                background: "rgba(255,255,255,.025)",
                border: "1px solid rgba(255,255,255,.07)",
                borderRadius: "14px",
                padding: "20px 22px",
              }}>
                <div style={{
                  fontSize: "10px", color: "#6B7280",
                  letterSpacing: ".1em", textTransform: "uppercase",
                  marginBottom: "4px",
                }}>
                  Channel Stats
                </div>
                <MetricRow label="Subscribers"       value={fmt(data.subscribers)} />
                <MetricRow label="Total Views"        value={fmt(data.totalViews)} />
                <MetricRow label="Videos"             value={data.videos.toLocaleString()} />
                <MetricRow label="Avg Views / Video"  value={fmt(data.avgViews)} />
                <MetricRow label="Engagement Ratio"   value={data.engagementRatio} />
              </div>

              {/* Performance breakdown */}
              <div style={{
                background: "rgba(255,255,255,.025)",
                border: "1px solid rgba(255,255,255,.07)",
                borderRadius: "14px",
                padding: "20px 22px",
                display: "flex", flexDirection: "column", gap: "14px",
              }}>
                <div style={{
                  fontSize: "10px", color: "#6B7280",
                  letterSpacing: ".1em", textTransform: "uppercase",
                }}>
                  Performance Breakdown
                </div>
                <ScoreBar label="Scale Position"  value={data.scalePosition}    color="#F5A623" />
                <ScoreBar label="Consistency"     value={data.consistencyScore} color="#34D399" />
                <ScoreBar label="Activity"        value={data.activityScore}    color="#60A5FA" />

                {/* Final score callout */}
                <div style={{
                  marginTop: "4px", padding: "11px 14px",
                  background: "rgba(245,166,35,.07)",
                  border: "1px solid rgba(245,166,35,.2)",
                  borderRadius: "9px",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <span style={{ fontSize: "11px", color: "#9CA3AF" }}>Influence Score</span>
                  <span style={{
                    fontFamily: "'Syne', sans-serif", fontWeight: 800,
                    fontSize: "1.3rem", color: "#F5A623",
                  }}>
                    {parseFloat(data.influenceScore).toFixed(1)}
                  </span>
                </div>
              </div>
            </div>

            {/* Platform bar */}
            <div style={{
              background: "rgba(255,255,255,.02)",
              border: "1px solid rgba(255,255,255,.055)",
              borderRadius: "12px",
              padding: "14px 20px",
              display: "flex", alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap", gap: "12px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{
                  width: "28px", height: "28px", borderRadius: "7px",
                  background: "rgba(255,68,68,.12)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#FF4444", fontSize: "13px",
                }}>
                  ▶
                </div>
                <div>
                  <div style={{
                    fontSize: "12px",
                    fontFamily: "'Syne', sans-serif", fontWeight: 600,
                  }}>
                    YouTube
                  </div>
                  <div style={{ fontSize: "10px", color: "#4B5563" }}>Active connection</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "24px" }}>
                {[
                  { l: "Subscribers", v: fmt(data.subscribers) },
                  { l: "Total Views",  v: fmt(data.totalViews)  },
                  { l: "Videos",       v: data.videos.toLocaleString() },
                ].map(({ l, v }) => (
                  <div key={l} style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "10px", color: "#4B5563" }}>{l}</div>
                    <div style={{
                      fontSize: "13px",
                      fontFamily: "'Syne', sans-serif", fontWeight: 700,
                    }}>
                      {v}
                    </div>
                  </div>
                ))}
              </div>

              {["Instagram", "X (Twitter)"].map((p) => (
                <div key={p} style={{
                  padding: "6px 12px", borderRadius: "7px",
                  background: "rgba(255,255,255,.03)",
                  border: "1px solid rgba(255,255,255,.06)",
                  fontSize: "11px", color: "#4B5563",
                }}>
                  {p} · soon
                </div>
              ))}
            </div>
          </>
        )}

        {/* Empty state ── */}
        {!data && !loading && (
          <div style={{
            marginTop: "64px", textAlign: "center",
            color: "#374151",
          }}>
            <div style={{ fontSize: "36px", marginBottom: "12px", opacity: .4 }}>▶</div>
            <div style={{
              fontFamily: "'Syne', sans-serif", fontWeight: 700,
              fontSize: "15px", marginBottom: "6px",
            }}>
              Search a YouTube channel to begin
            </div>
            <div style={{ fontSize: "12px" }}>
              Try: MrBeast · PewDiePie · Linus Tech Tips
            </div>
          </div>
        )}
      </div>
    </>
  );
}
