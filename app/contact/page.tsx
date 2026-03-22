"use client";

import { useState } from "react";

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

const CONTACT_EMAIL = "hello@inflyio.com"; // ← swap when ready

type FormState = "idle" | "sending" | "sent" | "error";
interface FormData { name: string; email: string; subject: string; message: string; }

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <label style={{ fontSize: "10px", color: C.textSec, letterSpacing: ".1em", textTransform: "uppercase", fontFamily: "'DM Mono',monospace" }}>{label}</label>
        {hint && <span style={{ fontSize: "10px", color: C.textSec }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "11px 14px",
  background: "rgba(15,20,30,0.6)",
  border: `1px solid ${C.borderMid}`,
  borderRadius: "9px", color: C.textPri,
  fontSize: "13px", fontFamily: "'DM Mono',monospace",
  outline: "none", transition: "border-color .2s, box-shadow .2s",
};

export default function ContactPage() {
  const [form, setForm] = useState<FormData>({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<FormState>("idle");

  const set = (k: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setStatus("sending");
    try {
      const body     = encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`);
      const mailto   = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(form.subject || "Inflyio Enquiry")}&body=${body}`;
      window.location.href = mailto;
      setTimeout(() => { setStatus("sent"); setForm({ name: "", email: "", subject: "", message: "" }); }, 800);
    } catch { setStatus("error"); }
  };

  return (
    <>
      <style>{`
        @keyframes fade-up  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:.3} }
        .f1{animation:fade-up .45s ease both}
        .f2{animation:fade-up .45s .08s ease both}
        .f3{animation:fade-up .45s .16s ease both}
        .cinput:focus{border-color:${C.blueBorder}!important;box-shadow:${C.blueGlow}!important}
        .sbtn{transition:opacity .15s,transform .1s}
        .sbtn:hover:not(:disabled){opacity:.88}
        .sbtn:active:not(:disabled){transform:scale(.98)}

        .contact-layout { display: grid; grid-template-columns: 1fr 300px; gap: 24px; align-items: start; }
        .name-row       { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

        @media (max-width: 760px) {
          .contact-layout { grid-template-columns: 1fr !important; }
          .name-row       { grid-template-columns: 1fr !important; }
          .contact-pad    { padding: 20px 16px !important; }
        }
      `}</style>

      <div className="contact-pad" style={{ padding: "32px 36px", maxWidth: "820px", fontFamily: "'DM Mono',monospace", color: C.textPri }}>

        {/* Header */}
        <div className="f1" style={{ marginBottom: "36px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: C.blue, boxShadow: `0 0 8px ${C.blue}`, display: "inline-block", animation: "pulse-dot 2s infinite" }} />
            <span style={{ fontSize: "10px", color: C.blue, letterSpacing: ".12em", textTransform: "uppercase" }}>Get in Touch</span>
          </div>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "clamp(1.4rem,4vw,2rem)", letterSpacing: "-.025em", margin: 0 }}>
            Contact{" "}
            <span style={{ background: `linear-gradient(90deg,${C.blue},${C.cyan})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Us</span>
          </h1>
          <p style={{ fontSize: "12px", color: C.textSec, marginTop: "8px", maxWidth: "480px", lineHeight: 1.8 }}>
            Have a question, partnership idea, or feedback about Inflyio? We read every message and typically respond within 24 hours.
          </p>
        </div>

        {/* 2-col → 1-col layout */}
        <div className="contact-layout">

          {/* Form */}
          <div className="f2" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "16px", padding: "28px" }}>
            {status === "sent" ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", gap: "14px", textAlign: "center" }}>
                <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", color: C.green }}>✓</div>
                <div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "16px", color: C.textPri, marginBottom: "6px" }}>Message sent!</div>
                  <div style={{ fontSize: "12px", color: C.textSec, lineHeight: 1.7 }}>
                    Your mail client should have opened.<br />
                    We'll reply to <span style={{ color: C.blue }}>{form.email || "your email"}</span>.
                  </div>
                </div>
                <button onClick={() => setStatus("idle")} style={{ marginTop: "8px", padding: "9px 20px", borderRadius: "8px", background: C.blueDim, border: `1px solid ${C.blueBorder}`, color: C.blue, fontSize: "12px", fontFamily: "'DM Mono',monospace", cursor: "pointer" }}>
                  Send another →
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                <div className="name-row">
                  <Field label="Your Name" hint="required">
                    <input type="text" placeholder="Alex Sharma" value={form.name} onChange={set("name")} required className="cinput" style={inputStyle} />
                  </Field>
                  <Field label="Email Address" hint="required">
                    <input type="email" placeholder="you@example.com" value={form.email} onChange={set("email")} required className="cinput" style={inputStyle} />
                  </Field>
                </div>
                <Field label="Subject">
                  <select value={form.subject} onChange={set("subject")} className="cinput" style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}>
                    <option value="" style={{ background: "#0A0B0F" }}>Select a topic…</option>
                    <option value="Partnership Enquiry" style={{ background: "#0A0B0F" }}>Partnership Enquiry</option>
                    <option value="Feature Request"     style={{ background: "#0A0B0F" }}>Feature Request</option>
                    <option value="Bug Report"          style={{ background: "#0A0B0F" }}>Bug Report</option>
                    <option value="Billing"             style={{ background: "#0A0B0F" }}>Billing</option>
                    <option value="General Question"    style={{ background: "#0A0B0F" }}>General Question</option>
                    <option value="Other"               style={{ background: "#0A0B0F" }}>Other</option>
                  </select>
                </Field>
                <Field label="Message" hint="required">
                  <textarea placeholder="Tell us what's on your mind…" value={form.message} onChange={set("message")} required rows={5} className="cinput" style={{ ...inputStyle, resize: "vertical", minHeight: "120px", lineHeight: 1.7 }} />
                </Field>
                {status === "error" && (
                  <div style={{ padding: "10px 14px", background: "rgba(248,113,113,.07)", border: "1px solid rgba(248,113,113,.2)", borderRadius: "8px", fontSize: "12px", color: C.red }}>
                    ⚠ Something went wrong. Email us directly at{" "}
                    <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: C.blue }}>{CONTACT_EMAIL}</a>
                  </div>
                )}
                <button type="submit" disabled={status === "sending"} className="sbtn"
                  style={{ padding: "12px 24px", borderRadius: "10px", background: `linear-gradient(135deg,${C.blue},#3B82F6)`, border: "none", color: "#07080C", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "13px", cursor: status === "sending" ? "not-allowed" : "pointer", opacity: status === "sending" ? 0.65 : 1, alignSelf: "flex-start" }}>
                  {status === "sending" ? "Opening mail client…" : "Send Message →"}
                </button>
              </form>
            )}
          </div>

          {/* Right panel */}
          <div className="f3" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ background: C.blueDim, border: `1px solid ${C.blueBorder}`, borderRadius: "14px", padding: "20px", boxShadow: C.blueGlow }}>
              <div style={{ fontSize: "10px", color: C.blue, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: "10px" }}>Email Us</div>
              <a href={`mailto:${CONTACT_EMAIL}`} style={{ display: "block", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "14px", color: C.textPri, textDecoration: "none", marginBottom: "4px" }}>
                {CONTACT_EMAIL}
              </a>
              <div style={{ fontSize: "11px", color: C.textSec, lineHeight: 1.6 }}>We respond within 24 hours on business days.</div>
            </div>

            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "14px", padding: "20px" }}>
              <div style={{ fontSize: "10px", color: C.textSec, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: "14px" }}>What to Expect</div>
              {[
                { icon: "◉", label: "Partnerships",    val: "1–2 days"  },
                { icon: "▲", label: "Feature Requests", val: "2–3 days" },
                { icon: "⚠", label: "Bug Reports",     val: "Same day"  },
                { icon: "✉", label: "General",         val: "24 hours"  },
              ].map(({ icon, label, val }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "11px", color: C.textSec }}>{icon}</span>
                    <span style={{ fontSize: "12px", color: C.textMid }}>{label}</span>
                  </div>
                  <span style={{ fontSize: "11px", color: C.blue, fontFamily: "'DM Mono',monospace" }}>{val}</span>
                </div>
              ))}
            </div>

            <div style={{ padding: "14px 16px", background: "rgba(255,255,255,.02)", border: `1px solid ${C.border}`, borderRadius: "12px", fontSize: "11px", color: C.textSec, lineHeight: 1.7 }}>
              <span style={{ color: C.textMid, fontFamily: "'Syne',sans-serif", fontWeight: 600 }}>inflyio</span>{" "}
              is actively being built. Your feedback directly shapes what we build next.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
