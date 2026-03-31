"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const C = {
  bg:         "#07080C",
  surface:    "rgba(255,255,255,0.03)",
  border:     "rgba(255,255,255,0.07)",
  borderMid:  "rgba(255,255,255,0.12)",
  blue:       "#60A5FA",
  blueDim:    "rgba(96,165,250,0.10)",
  blueBorder: "rgba(96,165,250,0.28)",
  cyan:       "#67E8F9",
  green:      "#34D399",
  amber:      "#F59E0B",
  textPri:    "#F1F5F9",
  textSec:    "#64748B",
  textMid:    "#94A3B8",
};

const TIERS = [
  { name: "Emerging",      color: "#475569", score: "0–10"   },
  { name: "Rising",        color: "#64748B", score: "10–20"  },
  { name: "Developing",    color: "#64748B", score: "20–30"  },
  { name: "Established",   color: "#94A3B8", score: "30–40"  },
  { name: "Recognized",    color: "#94A3B8", score: "40–50"  },
  { name: "Influencer",    color: "#34D399", score: "50–60"  },
  { name: "Major",         color: "#60A5FA", score: "60–67"  },
  { name: "Power Creator", color: "#60A5FA", score: "67–74"  },
  { name: "Elite",         color: "#67E8F9", score: "74–82"  },
  { name: "Superstar",     color: "#60A5FA", score: "82–90"  },
  { name: "Global Icon",   color: "#A78BFA", score: "90–96"  },
  { name: "Titan",         color: "#67E8F9", score: "96–100" },
];

const FEATURES = [
  { icon: "◎", color: "#60A5FA", title: "Influence Score",   desc: "A single 0–100 score across 12 tiers — from Emerging to Titan. Calibrated against subscriber scale, engagement, and content consistency."  },
  { icon: "▲", color: "#34D399", title: "6 Deep KPIs",       desc: "Real Engagement Rate, Upload Velocity, Momentum Score, Viral Coefficient, Audience Loyalty Index, and Content Consistency — all in one view." },
  { icon: "▶", color: "#67E8F9", title: "Video Analytics",   desc: "30-video deep dive with a growth trajectory chart, performance distribution, and every video benchmarked against the channel's own average."   },
  { icon: "◈", color: "#F59E0B", title: "Content Patterns",  desc: "Best upload day, optimal title length, tag density impact, evergreen ratio — the data behind what actually works for each channel."           },
];

const STEPS = [
  { num: "01", title: "Search any channel",       desc: "Enter any YouTube channel name. We find and verify it instantly."                                         },
  { num: "02", title: "We analyse 30 videos",     desc: "Our engine fetches stats, calculates 6 KPIs, and scores the channel in seconds using 4 API calls."        },
  { num: "03", title: "Get full intelligence",    desc: "Influence score, tier placement, video analytics, and content patterns — all in one clean dashboard view." },
];

export default function LandingPage() {
  const [score, setScore] = useState(0);

  useEffect(() => {
    const target = 74.2;
    let current  = 0;
    const step   = target / 70;
    const timer  = setInterval(() => {
      current = Math.min(current + step, target);
      setScore(Math.round(current * 10) / 10);
      if (current >= target) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, []);

  const r = 54, circ = 2 * Math.PI * r, pct = score / 100;

  return (
    <>
      <style>{`
        @keyframes fade-up   { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:.35} }
        @keyframes float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        .f1{animation:fade-up .55s ease both}
        .f2{animation:fade-up .55s .08s ease both}
        .f3{animation:fade-up .55s .16s ease both}
        .f4{animation:fade-up .55s .24s ease both}
        .f5{animation:fade-up .55s .32s ease both}
        .hero-float{animation:float 5s ease-in-out infinite}
        .cta-pri{transition:opacity .15s,transform .12s}
        .cta-pri:hover{opacity:.88;transform:translateY(-1px)}
        .cta-sec{transition:background .15s}
        .cta-sec:hover{background:rgba(255,255,255,0.07)!important}
        .feat-card{transition:border-color .2s,background .2s}
        .feat-card:hover{border-color:rgba(255,255,255,0.14)!important;background:rgba(255,255,255,0.045)!important}
        .tier-pill{transition:transform .15s}
        .tier-pill:hover{transform:translateY(-2px)}
        .step-card:hover .step-num{opacity:.08!important}
        .nl:hover{color:#F1F5F9!important}
        .nl{transition:color .15s}

        @media(max-width:860px){
          .hero-inner{flex-direction:column!important;align-items:flex-start!important}
          .hero-card-wrap{display:none!important}
        }
        @media(max-width:640px){
          .nav-links{display:none!important}
          .hero-section{padding:60px 24px 50px!important}
          .section-pad{padding:50px 24px!important}
          .footer-inner{flex-direction:column!important;gap:16px!important;align-items:flex-start!important}
          .steps-grid{grid-template-columns:1fr!important}
          .feat-grid{grid-template-columns:1fr!important}
          .stat-strip{gap:24px!important}
        }
      `}</style>

      <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'DM Mono',monospace", color: C.textPri, overflowX: "hidden" }}>

        {/* ── Navbar ───────────────────────────────────────────────────────── */}
        <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(7,8,12,0.88)", backdropFilter: "blur(14px)", borderBottom: `1px solid ${C.border}`, height: "58px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 40px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "linear-gradient(135deg,#60A5FA,#3B82F6)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Syne',sans-serif", fontWeight: 800, color: "#07080C", fontSize: "14px" }}>I</div>
            <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "16px" }}>inflyio</span>
          </div>
          <div className="nav-links" style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <a href="#features" className="nl" style={{ fontSize: "12px", color: C.textSec, textDecoration: "none" }}>Features</a>
            <a href="#tiers"    className="nl" style={{ fontSize: "12px", color: C.textSec, textDecoration: "none" }}>Tiers</a>
            <a href="#how"      className="nl" style={{ fontSize: "12px", color: C.textSec, textDecoration: "none" }}>How it works</a>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <Link href="/auth" className="nl" style={{ fontSize: "12px", color: C.textSec, textDecoration: "none", padding: "7px 14px" }}>Sign in</Link>
            <Link href="/auth" style={{ fontSize: "12px", padding: "8px 18px", background: C.blueDim, border: `1px solid ${C.blueBorder}`, borderRadius: "8px", color: C.blue, textDecoration: "none", fontWeight: 500 }}>
              Get started →
            </Link>
          </div>
        </nav>

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section className="hero-section" style={{ maxWidth: "1100px", margin: "0 auto", padding: "88px 40px 72px" }}>
          <div className="hero-inner" style={{ display: "flex", alignItems: "center", gap: "64px" }}>

            <div style={{ flex: "1 1 440px", minWidth: "280px" }}>
              <div className="f1" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "5px 14px", background: C.blueDim, border: `1px solid ${C.blueBorder}`, borderRadius: "20px", marginBottom: "22px" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: C.green, display: "inline-block", animation: "pulse-dot 2s infinite" }} />
                <span style={{ fontSize: "11px", color: C.blue, letterSpacing: ".08em" }}>YouTube Analysis · Live</span>
              </div>

              <h1 className="f2" style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "clamp(2rem,5vw,3.1rem)", lineHeight: 1.1, letterSpacing: "-.03em", margin: "0 0 20px" }}>
                Know your influence.{" "}
                <span style={{ background: `linear-gradient(90deg,${C.blue},${C.cyan})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  Prove your worth.
                </span>
              </h1>

              <p className="f3" style={{ fontSize: "14px", color: C.textMid, lineHeight: 1.9, maxWidth: "460px", margin: "0 0 30px" }}>
                Inflyio scores any YouTube channel across 12 tiers — backed by 30-video deep analytics, 6 creator KPIs, and content pattern intelligence. Built for creators, brands, and agencies.
              </p>

              <div className="f4" style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <Link href="/dashboard" className="cta-pri" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "13px 28px", background: `linear-gradient(135deg,${C.blue},#3B82F6)`, borderRadius: "10px", color: "#07080C", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "14px", textDecoration: "none", border: "none" }}>
                  Analyse a channel →
                </Link>
                <a href="#how" className="cta-sec" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "13px 22px", background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: "10px", color: C.textMid, fontSize: "13px", textDecoration: "none" }}>
                  How it works
                </a>
              </div>

              <div className="f5 stat-strip" style={{ display: "flex", gap: "36px", marginTop: "40px", paddingTop: "32px", borderTop: `1px solid ${C.border}`, flexWrap: "wrap" }}>
                {[{ v: "12", l: "Creator tiers" }, { v: "30", l: "Videos analysed" }, { v: "6", l: "Deep KPIs" }, { v: "~4", l: "API units / search" }].map(({ v, l }) => (
                  <div key={l}>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "1.55rem", color: C.textPri }}>{v}</div>
                    <div style={{ fontSize: "11px", color: C.textSec, marginTop: "3px" }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Animated score card */}
            <div className="hero-card-wrap" style={{ flexShrink: 0 }}>
              <div className="hero-float" style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${C.border}`, borderRadius: "22px", padding: "28px 30px", width: "234px", boxShadow: "0 40px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)" }}>
                <div style={{ fontSize: "10px", color: C.textSec, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: "20px" }}>Influence Score</div>
                <div style={{ position: "relative", width: "140px", height: "140px", margin: "0 auto 18px" }}>
                  <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: "rotate(-90deg)" }}>
                    <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="9" />
                    <circle cx="70" cy="70" r={r} fill="none" stroke="#67E8F9" strokeWidth="9" strokeLinecap="round"
                      strokeDasharray={`${circ * pct} ${circ}`} style={{ transition: "stroke-dasharray .05s linear" }} />
                  </svg>
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "2rem", color: "#67E8F9", lineHeight: 1 }}>{score.toFixed(1)}</span>
                    <span style={{ fontSize: "10px", color: C.textSec, marginTop: "3px", letterSpacing: ".08em" }}>SCORE</span>
                  </div>
                </div>
                <div style={{ textAlign: "center", marginBottom: "16px" }}>
                  <span style={{ fontSize: "11px", padding: "4px 14px", borderRadius: "6px", background: "rgba(103,232,249,0.10)", color: "#67E8F9", border: "1px solid rgba(103,232,249,0.22)", fontWeight: 600, letterSpacing: ".05em" }}>Elite</span>
                </div>
                {[
                  { l: "Momentum",    v: "187%", c: C.green },
                  { l: "Consistency", v: "82/100", c: C.blue  },
                  { l: "Engagement",  v: "4.3%",  c: C.amber },
                  { l: "Viral Coeff", v: "6.2×",  c: C.textMid },
                ].map(({ l, v, c }) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderTop: `1px solid ${C.border}` }}>
                    <span style={{ fontSize: "11px", color: C.textSec }}>{l}</span>
                    <span style={{ fontSize: "11px", color: c, fontWeight: 500, fontFamily: "'DM Mono',monospace" }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </section>

        {/* ── Features ──────────────────────────────────────────────────────── */}
        <section id="features" className="section-pad" style={{ maxWidth: "1100px", margin: "0 auto", padding: "60px 40px" }}>
          <div style={{ textAlign: "center", marginBottom: "44px" }}>
            <div style={{ fontSize: "10px", color: C.textSec, letterSpacing: ".14em", textTransform: "uppercase", marginBottom: "12px" }}>What you get</div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "clamp(1.4rem,3.5vw,2rem)", margin: 0, letterSpacing: "-.02em" }}>Every number that actually matters</h2>
          </div>
          <div className="feat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: "12px" }}>
            {FEATURES.map((f) => (
              <div key={f.title} className="feat-card" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "16px", padding: "24px 22px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: `${f.color}14`, border: `1px solid ${f.color}28`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", color: f.color, marginBottom: "16px" }}>{f.icon}</div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "14px", color: C.textPri, marginBottom: "8px" }}>{f.title}</div>
                <div style={{ fontSize: "12px", color: C.textSec, lineHeight: 1.85 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Tier strip ────────────────────────────────────────────────────── */}
        <section id="tiers" className="section-pad" style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 40px 60px" }}>
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <div style={{ fontSize: "10px", color: C.textSec, letterSpacing: ".14em", textTransform: "uppercase", marginBottom: "12px" }}>Creator tier system</div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "clamp(1.3rem,3.5vw,1.9rem)", margin: 0, letterSpacing: "-.02em" }}>Where do you rank?</h2>
            <p style={{ fontSize: "12px", color: C.textSec, marginTop: "10px" }}>12 tiers from 0 subscribers to 100M+. Every channel gets a precise score within its tier.</p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center" }}>
            {TIERS.map((t) => (
              <div key={t.name} className="tier-pill" style={{ padding: "9px 16px", borderRadius: "9px", background: `${t.color}10`, border: `1px solid ${t.color}26`, display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", cursor: "default" }}>
                <span style={{ fontSize: "12px", fontWeight: 600, color: t.color, fontFamily: "'Syne',sans-serif" }}>{t.name}</span>
                <span style={{ fontSize: "10px", color: C.textSec }}>{t.score}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── How it works ──────────────────────────────────────────────────── */}
        <section id="how" className="section-pad" style={{ maxWidth: "1100px", margin: "0 auto", padding: "60px 40px" }}>
          <div style={{ textAlign: "center", marginBottom: "44px" }}>
            <div style={{ fontSize: "10px", color: C.textSec, letterSpacing: ".14em", textTransform: "uppercase", marginBottom: "12px" }}>How it works</div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "clamp(1.4rem,3.5vw,2rem)", margin: 0, letterSpacing: "-.02em" }}>Three steps to full clarity</h2>
          </div>
          <div className="steps-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px" }}>
            {STEPS.map((s, i) => (
              <div key={s.num} className="step-card" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "16px", padding: "28px 24px", position: "relative", overflow: "hidden" }}>
                <div className="step-num" style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "4rem", color: "rgba(255,255,255,0.04)", position: "absolute", top: "10px", right: "18px", lineHeight: 1, userSelect: "none", transition: "opacity .2s" }}>{s.num}</div>
                <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: C.blueDim, border: `1px solid ${C.blueBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", color: C.blue, marginBottom: "16px", fontFamily: "'Syne',sans-serif", fontWeight: 700 }}>{i + 1}</div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "14px", color: C.textPri, marginBottom: "8px" }}>{s.title}</div>
                <div style={{ fontSize: "12px", color: C.textSec, lineHeight: 1.85 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Final CTA ─────────────────────────────────────────────────────── */}
        <section className="section-pad" style={{ maxWidth: "1100px", margin: "0 auto", padding: "20px 40px 80px" }}>
          <div style={{ background: "rgba(96,165,250,0.06)", border: `1px solid ${C.blueBorder}`, borderRadius: "22px", padding: "64px 40px", textAlign: "center", boxShadow: "0 0 80px rgba(96,165,250,0.07)" }}>
            <div style={{ fontSize: "10px", color: C.blue, letterSpacing: ".14em", textTransform: "uppercase", marginBottom: "16px" }}>Free to use</div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "clamp(1.6rem,4vw,2.4rem)", margin: "0 0 14px", letterSpacing: "-.025em" }}>
              Ready to see your score?
            </h2>
            <p style={{ fontSize: "13px", color: C.textMid, margin: "0 auto 28px", maxWidth: "380px", lineHeight: 1.9 }}>
              No credit card. No account required to start. Search any YouTube channel and get a full intelligence report in seconds.
            </p>
            <Link href="/dashboard" className="cta-pri" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "14px 32px", background: `linear-gradient(135deg,${C.blue},#3B82F6)`, borderRadius: "10px", color: "#07080C", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "14px", textDecoration: "none" }}>
              Start for free →
            </Link>
          </div>
        </section>

        {/* ── Footer ────────────────────────────────────────────────────────── */}
        <footer style={{ borderTop: `1px solid ${C.border}`, padding: "24px 40px" }}>
          <div className="footer-inner" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "22px", height: "22px", borderRadius: "6px", background: "linear-gradient(135deg,#60A5FA,#3B82F6)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Syne',sans-serif", fontWeight: 800, color: "#07080C", fontSize: "11px" }}>I</div>
              <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "14px" }}>inflyio</span>
              <span style={{ fontSize: "11px", color: C.textSec, marginLeft: "8px" }}>Creator Intelligence Platform</span>
            </div>
            <div style={{ display: "flex", gap: "20px", alignItems: "center", flexWrap: "wrap" }}>
              <Link href="/contact" className="nl" style={{ fontSize: "12px", color: C.textSec, textDecoration: "none" }}>Contact</Link>
              <Link href="/auth"    className="nl" style={{ fontSize: "12px", color: C.textSec, textDecoration: "none" }}>Sign in</Link>
              <Link href="/dashboard" className="nl" style={{ fontSize: "12px", color: C.textSec, textDecoration: "none" }}>Dashboard</Link>
              <span style={{ fontSize: "11px", color: C.textSec }}>© {new Date().getFullYear()} Inflyio</span>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}