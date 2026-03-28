"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

// ─── Design tokens (mirrors dashboard) ───────────────────────────────────────
const C = {
  bg:         "#07080C",
  surface:    "rgba(255,255,255,0.03)",
  border:     "rgba(255,255,255,0.07)",
  borderMid:  "rgba(255,255,255,0.12)",
  blue:       "#60A5FA",
  blueDim:    "rgba(96,165,250,0.10)",
  blueBorder: "rgba(96,165,250,0.28)",
  blueGlow:   "0 0 28px rgba(96,165,250,0.18)",
  cyan:       "#67E8F9",
  green:      "#34D399",
  red:        "#F87171",
  textPri:    "#F1F5F9",
  textSec:    "#64748B",
  textMid:    "#94A3B8",
};

type Mode = "signin" | "signup";

function AuthContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const next         = searchParams.get("next") ?? "/dashboard";

  const [mode, setMode]       = useState<Mode>("signin");
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // If user lands here already signed in, push them forward immediately.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace(next);
    });
  }, [next, router]);

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signin") {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) { setError(err.message); return; }
        router.replace(next);
      } else {
        const { error: err } = await supabase.auth.signUp({ email, password });
        if (err) { setError(err.message); return; }
        setSuccess("Account created! Check your email to confirm, then sign in.");
        setMode("signin");
        setPassword("");
      }
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    setSuccess(null);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; }

        @keyframes fade-up   { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin       { to{transform:rotate(360deg)} }
        @keyframes pulse-glow { 0%,100%{opacity:.7} 50%{opacity:1} }

        .auth-card  { animation: fade-up .4s ease both; }
        .auth-input { transition: border-color .15s, box-shadow .15s; }
        .auth-input:focus {
          outline: none;
          border-color: ${C.blueBorder} !important;
          box-shadow: ${C.blueGlow} !important;
        }
        .auth-btn {
          transition: opacity .15s, transform .1s;
          cursor: pointer;
        }
        .auth-btn:hover:not(:disabled) { opacity: .88; }
        .auth-btn:active:not(:disabled) { transform: scale(.98); }
        .tab-btn { transition: color .15s, border-color .15s, background .15s; cursor: pointer; }
        .tab-btn:hover { color: ${C.textMid} !important; }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: C.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        fontFamily: "'DM Mono', monospace",
      }}>
        <div className="auth-card" style={{ width: "100%", maxWidth: "400px" }}>

          {/* ── Logo ─────────────────────────────────────────────────── */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "32px", justifyContent: "center" }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "10px",
              background: "linear-gradient(135deg, #60A5FA, #3B82F6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'Syne', sans-serif", fontWeight: 800,
              color: "#07080C", fontSize: "18px",
              boxShadow: C.blueGlow,
            }}>I</div>
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "20px", color: C.textPri }}>
              inflyio
            </span>
          </div>

          {/* ── Card ─────────────────────────────────────────────────── */}
          <div style={{
            background: "rgba(255,255,255,0.025)",
            border: `1px solid ${C.border}`,
            borderRadius: "16px",
            overflow: "hidden",
          }}>

            {/* Tab switcher */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr",
              borderBottom: `1px solid ${C.border}`,
            }}>
              {(["signin", "signup"] as Mode[]).map((m) => {
                const active = mode === m;
                return (
                  <button
                    key={m}
                    className="tab-btn"
                    onClick={() => switchMode(m)}
                    style={{
                      background: active ? C.blueDim : "transparent",
                      border: "none",
                      borderBottom: active ? `2px solid ${C.blue}` : "2px solid transparent",
                      padding: "14px 0",
                      color: active ? C.blue : C.textSec,
                      fontSize: "12px",
                      fontFamily: "'DM Mono', monospace",
                      fontWeight: 500,
                      letterSpacing: ".06em",
                    }}
                  >
                    {m === "signin" ? "Sign In" : "Sign Up"}
                  </button>
                );
              })}
            </div>

            {/* Form body */}
            <div style={{ padding: "28px 24px" }}>

              {/* Headline */}
              <div style={{ marginBottom: "24px" }}>
                <h1 style={{
                  fontFamily: "'Syne', sans-serif", fontWeight: 800,
                  fontSize: "1.2rem", margin: "0 0 6px",
                  color: C.textPri, letterSpacing: "-.02em",
                }}>
                  {mode === "signin" ? "Welcome back" : "Create your account"}
                </h1>
                <p style={{ fontSize: "11px", color: C.textSec, margin: 0, lineHeight: 1.7 }}>
                  {mode === "signin"
                    ? "Sign in to access your Creator Intelligence dashboard."
                    : "Start analysing creators and tracking influence for free."}
                </p>
              </div>

              {/* Email */}
              <div style={{ marginBottom: "12px" }}>
                <label style={{ fontSize: "10px", color: C.textSec, letterSpacing: ".1em", textTransform: "uppercase", display: "block", marginBottom: "7px" }}>
                  Email
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  className="auth-input"
                  style={{
                    width: "100%", padding: "11px 14px",
                    background: "rgba(15,20,30,0.7)",
                    border: `1px solid ${C.borderMid}`,
                    borderRadius: "9px",
                    color: C.textPri, fontSize: "13px",
                    fontFamily: "'DM Mono', monospace",
                  }}
                />
              </div>

              {/* Password */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ fontSize: "10px", color: C.textSec, letterSpacing: ".1em", textTransform: "uppercase", display: "block", marginBottom: "7px" }}>
                  Password
                </label>
                <input
                  type="password"
                  placeholder={mode === "signup" ? "Min. 6 characters" : "Enter your password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  className="auth-input"
                  style={{
                    width: "100%", padding: "11px 14px",
                    background: "rgba(15,20,30,0.7)",
                    border: `1px solid ${C.borderMid}`,
                    borderRadius: "9px",
                    color: C.textPri, fontSize: "13px",
                    fontFamily: "'DM Mono', monospace",
                  }}
                />
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  marginBottom: "16px", padding: "10px 14px",
                  background: "rgba(248,113,113,0.07)",
                  border: "1px solid rgba(248,113,113,0.22)",
                  borderRadius: "8px", fontSize: "12px", color: C.red,
                }}>
                  ⚠ {error}
                </div>
              )}

              {/* Success */}
              {success && (
                <div style={{
                  marginBottom: "16px", padding: "10px 14px",
                  background: "rgba(52,211,153,0.07)",
                  border: "1px solid rgba(52,211,153,0.22)",
                  borderRadius: "8px", fontSize: "12px", color: C.green,
                }}>
                  ✓ {success}
                </div>
              )}

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="auth-btn"
                style={{
                  width: "100%", padding: "12px",
                  borderRadius: "9px",
                  background: `linear-gradient(135deg, ${C.blue}, #3B82F6)`,
                  border: "none",
                  color: "#07080C",
                  fontFamily: "'Syne', sans-serif", fontWeight: 700,
                  fontSize: "13px",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  opacity: loading ? 0.65 : 1,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? (
                  <>
                    <span style={{
                      width: "13px", height: "13px",
                      border: "2px solid rgba(0,0,0,.25)", borderTopColor: "#07080C",
                      borderRadius: "50%", display: "inline-block",
                      animation: "spin .7s linear infinite",
                    }} />
                    {mode === "signin" ? "Signing in…" : "Creating account…"}
                  </>
                ) : (
                  mode === "signin" ? "Sign In →" : "Create Account →"
                )}
              </button>

              {/* Forgot password (sign-in only) */}
              {mode === "signin" && (
                <button
                  onClick={async () => {
                    if (!email.trim()) { setError("Enter your email above first."); return; }
                    setLoading(true); setError(null);
                    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
                      redirectTo: `${window.location.origin}/auth/reset`,
                    });
                    setLoading(false);
                    if (err) { setError(err.message); return; }
                    setSuccess("Password reset email sent — check your inbox.");
                  }}
                  style={{
                    background: "none", border: "none", padding: "12px 0 0",
                    width: "100%", textAlign: "center",
                    fontSize: "11px", color: C.textSec,
                    fontFamily: "'DM Mono', monospace",
                    cursor: "pointer", display: "block",
                    transition: "color .15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = C.textMid)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = C.textSec)}
                >
                  Forgot password?
                </button>
              )}
            </div>
          </div>

          {/* ── Footer note ──────────────────────────────────────────── */}
          <p style={{ textAlign: "center", fontSize: "10px", color: C.textSec, marginTop: "20px", lineHeight: 1.8 }}>
            By continuing you agree to Inflyio&apos;s terms of service.
          </p>
        </div>
      </div>
    </>
  );
}

// ─── Suspense wrapper — required to avoid Vercel prerender error ──────────────
export default function AuthPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: "100vh", background: "#07080C",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{
          width: "16px", height: "16px", borderRadius: "50%",
          border: "2px solid #1E293B", borderTopColor: "#60A5FA",
          display: "inline-block", animation: "spin .7s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
}
