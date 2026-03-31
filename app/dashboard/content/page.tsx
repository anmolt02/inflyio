"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

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

interface LastAnalysis {
  name:            string;
  tier:            string;
  influence_score: number;
  followers:       number;
  avg_views:       number;
  engagement_rate: number;
  posts:           number;
  created_at:      string;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

// ─── Tier-specific recommendations ───────────────────────────────────────────
function getRecommendations(tier: string, engagementRate: number, posts: number) {
  const viewToSubRatio = engagementRate; // stored as avgViews/subscribers in DB

  const baseRecs: Record<string, { title: string; items: string[] }[]> = {
    Emerging: [
      { title: "Consistency is everything at this stage", items: ["Upload at least once a week — even imperfect content beats silence", "Pick 1 niche and stick to it for your first 50 videos", "Study your top 3 competitors with <5K subs and reverse-engineer their titles"] },
      { title: "Title and thumbnail come first", items: ["Spend 20% of your production time on title + thumbnail alone", "Use numbers and curiosity gaps: '5 things I wish I knew…'", "Keep titles under 60 characters — they show fully on mobile"] },
    ],
    Rising: [
      { title: "Double down on what's working", items: ["Identify your top 3 videos by views and make sequel content", "Upload 1–2 times per week minimum", "Reply to every comment — the algorithm rewards engagement signals"] },
      { title: "Build discoverability", items: ["Use 8–12 tags per video, mix broad and niche", "Add timestamps to every video — increases session time", "Optimize your channel description with searchable keywords"] },
    ],
    Developing: [
      { title: "Engagement is your next unlock", items: ["Add a clear call-to-action in the first 30 seconds of every video", "End screens and cards drive 12–25% of click-through to next videos — use them", "Go Live once a month minimum — it signals channel health to the algorithm"] },
      { title: "Analyse your outliers", items: ["Find your top 5 videos by views and identify the common pattern", "Make 3 videos in that same format and compare retention", "Test thumbnail styles — one change can 2× a video's click-through rate"] },
    ],
    Established: [
      { title: "Brand partnership readiness", items: ["Build a media kit: screenshot your score, KPIs, and top videos from Inflyio", "Add a business email to your channel description", "Reach out to 5 micro-brands that align with your niche — don't wait to be found"] },
      { title: "Retention is your core metric now", items: ["Aim for 40%+ average view duration — that's the threshold YouTube amplifies", "Hook viewers in the first 5 seconds — no long intros", "Use pattern interrupts every 90 seconds to maintain attention"] },
    ],
    Recognized: [
      { title: "Diversify your revenue", items: ["Enable channel memberships if you have a loyal community", "Create a digital product: guide, template, or mini-course", "Apply for the YouTube Partner Program if not already monetized"] },
      { title: "Scale your content operation", items: ["Consider hiring a video editor — frees up 8–12 hours per video", "Batch film 2–3 videos per session", "Build a content calendar 4 weeks ahead"] },
    ],
    Influencer: [
      { title: "You have leverage — use it", items: ["Negotiate brand deals with a rate card: CPM × avg views / 1000 as baseline", "Charge a premium for exclusivity or first-to-market positioning", "Cross-promote with creators in adjacent niches to reach new audiences"] },
      { title: "Protect your consistency score", items: ["Don't let upload gaps exceed 14 days — momentum drops sharply", "Build a 4-video backlog buffer before going on break", "Your Content Consistency score directly affects brand deal rates"] },
    ],
  };

  // For Major and above, use Influencer recs as a base + add advanced items
  const advancedRecs = [
    { title: "Operate at scale", items: ["Build a team: editor, thumbnail designer, content strategist", "Systemize your production pipeline with SOPs", "Monthly analytics review: compare this month's views/day to last month's"] },
    { title: "Protect and grow your authority", items: ["Speaking engagements and podcast appearances compound your reach", "Consider a second channel for experiments — protects your main channel's consistency", "Document your process publicly — creators with transparent journeys grow faster"] },
  ];

  const tierKey = tier in baseRecs ? tier : "Influencer";
  const recs = baseRecs[tierKey] ?? advancedRecs;

  // Add a contextual rec based on engagement_rate (view/sub ratio)
  const contextRec = viewToSubRatio > 0.5
    ? { title: "Your view-to-subscriber ratio is strong", items: ["Your existing audience is highly engaged — focus on growing subscribers now via Shorts and collaborations", "Add an end-screen subscribe CTA on every video"] }
    : { title: "Close the gap between subscribers and views", items: ["Your subscriber base isn't converting to views at full potential", "Send a community post when you upload — it re-engages dormant subscribers", "Pin a comment on your latest video asking subscribers to enable notifications"] };

  return [...recs, contextRec];
}

export default function ContentPage() {
  const [last, setLast]       = useState<LastAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId]   = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: session } = await supabase.auth.getSession();
      const uid = session.session?.user?.id;
      if (!uid) { setLoading(false); return; }
      setUserId(uid);

      const { data } = await supabase
        .from("creators")
        .select("name,tier,influence_score,followers,avg_views,engagement_rate,posts,created_at")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (data) setLast(data as LastAnalysis);
      setLoading(false);
    }
    load();
  }, []);

  const tierColor: Record<string, string> = {
    Titan: "#67E8F9", "Global Icon": "#A78BFA", Superstar: "#60A5FA", Elite: "#67E8F9",
    "Power Creator": "#60A5FA", Major: "#60A5FA", Influencer: "#34D399",
    Recognized: "#94A3B8", Established: "#64748B", Developing: "#64748B",
    Rising: "#475569", Emerging: "#475569",
  };
  const tc = last ? (tierColor[last.tier] ?? C.blue) : C.blue;

  return (
    <>
      <style>{`
        @keyframes fade-up { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .fa{animation:fade-up .4s ease both}
        @media(max-width:640px){ .cp-pad{padding:20px 16px!important} .recs-grid{grid-template-columns:1fr!important} }
      `}</style>

      <div className="cp-pad" style={{ padding: "32px 36px", maxWidth: "1080px", fontFamily: "'DM Mono',monospace", color: C.textPri }}>

        {/* Header */}
        <div className="fa" style={{ marginBottom: "28px" }}>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "clamp(1.3rem,3vw,1.7rem)", margin: "0 0 6px", letterSpacing: "-.02em" }}>Content</h1>
          <p style={{ fontSize: "12px", color: C.textSec, margin: 0 }}>Recommendations based on your last channel analysis.</p>
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: "60px 0", color: C.textSec, fontSize: "12px" }}>Loading your last analysis…</div>
        )}

        {!loading && !last && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: "28px", opacity: 0.15, marginBottom: "14px" }}>▶</div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "15px", color: C.textMid, marginBottom: "8px" }}>No analysis yet</div>
            <div style={{ fontSize: "12px", color: C.textSec, marginBottom: "20px" }}>Search a YouTube channel first to get personalised recommendations.</div>
            <Link href="/dashboard" style={{ display: "inline-flex", padding: "10px 22px", background: C.blueDim, border: `1px solid ${C.blueBorder}`, borderRadius: "9px", color: C.blue, fontSize: "13px", textDecoration: "none" }}>
              Go to Dashboard →
            </Link>
          </div>
        )}

        {!loading && last && (() => {
          const recs = getRecommendations(last.tier, last.engagement_rate, last.posts);
          const daysAgo = Math.round((Date.now() - new Date(last.created_at).getTime()) / 86400000);
          return (
            <>
              {/* Last analysis card */}
              <div className="fa" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "14px", padding: "18px 22px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: "180px" }}>
                  <div style={{ fontSize: "10px", color: C.textSec, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: "4px" }}>Last analysed</div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "1.1rem", color: C.textPri, marginBottom: "4px" }}>{last.name}</div>
                  <div style={{ fontSize: "11px", color: C.textSec }}>{daysAgo === 0 ? "Today" : `${daysAgo}d ago`}</div>
                </div>
                <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
                  {[{ l: "Score", v: `${last.influence_score.toFixed(1)}`, c: tc }, { l: "Subscribers", v: fmt(last.followers), c: C.textPri }, { l: "Avg Views", v: fmt(last.avg_views), c: C.textPri }, { l: "Videos", v: last.posts.toLocaleString(), c: C.textPri }].map(({ l, v, c }) => (
                    <div key={l} style={{ textAlign: "center" }}>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "1.1rem", color: c }}>{v}</div>
                      <div style={{ fontSize: "10px", color: C.textSec, marginTop: "2px" }}>{l}</div>
                    </div>
                  ))}
                  <div style={{ textAlign: "center" }}>
                    <span style={{ padding: "4px 12px", borderRadius: "6px", fontSize: "11px", fontWeight: 600, background: `${tc}14`, border: `1px solid ${tc}28`, color: tc }}>{last.tier}</span>
                  </div>
                </div>
                <Link href="/dashboard" style={{ fontSize: "12px", color: C.blue, textDecoration: "none", whiteSpace: "nowrap", padding: "8px 16px", background: C.blueDim, border: `1px solid ${C.blueBorder}`, borderRadius: "8px" }}>
                  Re-analyse →
                </Link>
              </div>

              {/* Section label */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                <span style={{ fontSize: "10px", color: C.textSec, letterSpacing: ".1em", textTransform: "uppercase", whiteSpace: "nowrap" }}>Recommendations for {last.tier} tier</span>
                <div style={{ flex: 1, height: "1px", background: C.border }} />
              </div>

              {/* Recommendations grid */}
              <div className="recs-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "12px", marginBottom: "28px" }}>
                {recs.map((rec, ri) => (
                  <div key={ri} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "14px", padding: "20px 20px" }}>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "13px", color: C.textPri, marginBottom: "14px", lineHeight: 1.4 }}>{rec.title}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {rec.items.map((item, ii) => (
                        <div key={ii} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                          <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: tc, flexShrink: 0, marginTop: "5px" }} />
                          <span style={{ fontSize: "12px", color: C.textMid, lineHeight: 1.75 }}>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Re-analyse nudge */}
              <div style={{ background: C.blueDim, border: `1px solid ${C.blueBorder}`, borderRadius: "12px", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <div style={{ fontSize: "13px", color: C.blue, fontWeight: 500, marginBottom: "3px" }}>Want deeper video-level insights?</div>
                  <div style={{ fontSize: "11px", color: C.textSec }}>Full 30-video breakdown with content patterns and growth trajectory.</div>
                </div>
                <Link href={`/dashboard/video-analytics?channelId=&name=${encodeURIComponent(last.name)}`} style={{ padding: "9px 18px", background: "rgba(96,165,250,0.15)", border: `1px solid ${C.blueBorder}`, borderRadius: "8px", color: C.blue, fontSize: "12px", textDecoration: "none", whiteSpace: "nowrap" }}>
                  View Video Analytics →
                </Link>
              </div>
            </>
          );
        })()}
      </div>
    </>
  );
}