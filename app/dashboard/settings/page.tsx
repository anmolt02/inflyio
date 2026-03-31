"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

const C = {
  surface:    "rgba(255,255,255,0.03)",
  border:     "rgba(255,255,255,0.07)",
  borderMid:  "rgba(255,255,255,0.12)",
  blue:       "#60A5FA",
  blueDim:    "rgba(96,165,250,0.10)",
  blueBorder: "rgba(96,165,250,0.28)",
  green:      "#34D399",
  red:        "#F87171",
  textPri:    "#F1F5F9",
  textSec:    "#64748B",
  textMid:    "#94A3B8",
};

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "14px", padding: "22px 24px", ...style }}>
      {children}
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, disabled }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; disabled?: boolean;
}) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <label style={{ display: "block", fontSize: "11px", color: C.textSec, marginBottom: "7px", letterSpacing: ".06em" }}>{label}</label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={60}
        style={{ width: "100%", boxSizing: "border-box", background: "rgba(15,20,30,0.6)", border: `1px solid ${C.borderMid}`, borderRadius: "9px", color: disabled ? C.textSec : C.textPri, fontFamily: "'DM Mono',monospace", fontSize: "13px", padding: "11px 14px", outline: "none", transition: "border-color .15s", opacity: disabled ? 0.6 : 1 }}
        onFocus={e => { e.currentTarget.style.borderColor = C.blueBorder; }}
        onBlur={e  => { e.currentTarget.style.borderColor = C.borderMid; }}
      />
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();

  const [email,       setEmail]       = useState("");
  const [userId,      setUserId]      = useState("");
  const [displayName, setDisplayName] = useState("");
  const [nameInput,   setNameInput]   = useState("");

  const [nameSaving,  setNameSaving]  = useState(false);
  const [nameMsg,     setNameMsg]     = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting,    setDeleting]    = useState(false);
  const [delError,    setDelError]    = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user;
      if (!user) { router.replace("/auth"); return; }
      setUserId(user.id);
      setEmail(user.email ?? "");
      const name = user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "";
      setDisplayName(name);
      setNameInput(name);
    });
  }, [router]);

  const saveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed || trimmed === displayName) return;
    setNameSaving(true); setNameMsg(null);
    const { error } = await supabase.auth.updateUser({ data: { full_name: trimmed } });
    if (error) {
      setNameMsg({ type: "err", text: error.message });
    } else {
      setDisplayName(trimmed);
      setNameMsg({ type: "ok", text: "Display name updated." });
    }
    setNameSaving(false);
    setTimeout(() => setNameMsg(null), 3500);
  };

  const deleteAccount = async () => {
    setDeleting(true); setDelError(null);
    try {
      const res  = await fetch("/api/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const json = await res.json();
      if (!res.ok || json.error) { setDelError(json.error ?? "Failed to delete account."); setDeleting(false); return; }
      await supabase.auth.signOut();
      router.replace("/");
    } catch {
      setDelError("Something went wrong. Try again.");
      setDeleting(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes fade-up { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .fa{animation:fade-up .4s ease both}
        @media(max-width:640px){ .sp-pad{padding:20px 16px!important} }
      `}</style>

      <div className="sp-pad" style={{ padding: "32px 36px", maxWidth: "640px", fontFamily: "'DM Mono',monospace", color: C.textPri }}>

        <div className="fa" style={{ marginBottom: "28px" }}>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "clamp(1.3rem,3vw,1.7rem)", margin: "0 0 6px", letterSpacing: "-.02em" }}>Settings</h1>
          <p style={{ fontSize: "12px", color: C.textSec, margin: 0 }}>Manage your account preferences.</p>
        </div>

        {/* ── Profile section ────────────────────────────────────────────── */}
        <div style={{ fontSize: "10px", color: C.textSec, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: "12px" }}>Profile</div>
        <Card style={{ marginBottom: "24px" }}>
          <InputField label="Display name" value={nameInput} onChange={setNameInput} placeholder="Your name or handle" />
          <InputField label="Email address" value={email} onChange={() => {}} disabled />

          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "4px" }}>
            <button
              onClick={saveName}
              disabled={nameSaving || !nameInput.trim() || nameInput.trim() === displayName}
              style={{ padding: "10px 22px", background: C.blueDim, border: `1px solid ${C.blueBorder}`, borderRadius: "9px", color: C.blue, fontSize: "12px", fontFamily: "'DM Mono',monospace", cursor: (nameSaving || !nameInput.trim() || nameInput.trim() === displayName) ? "not-allowed" : "pointer", opacity: (nameSaving || !nameInput.trim() || nameInput.trim() === displayName) ? 0.55 : 1, transition: "opacity .15s" }}
            >
              {nameSaving ? "Saving…" : "Save changes"}
            </button>
            {nameMsg && (
              <span style={{ fontSize: "12px", color: nameMsg.type === "ok" ? C.green : C.red }}>
                {nameMsg.type === "ok" ? "✓" : "⚠"} {nameMsg.text}
              </span>
            )}
          </div>
        </Card>

        {/* ── Account info ───────────────────────────────────────────────── */}
        <div style={{ fontSize: "10px", color: C.textSec, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: "12px" }}>Account</div>
        <Card style={{ marginBottom: "24px" }}>
          {[{ l: "Plan", v: "Free" }, { l: "Platform", v: "YouTube" }, { l: "User ID", v: userId ? `${userId.slice(0, 8)}…` : "—" }].map(({ l, v }) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: "12px", color: C.textSec }}>{l}</span>
              <span style={{ fontSize: "12px", color: C.textMid, fontFamily: "'DM Mono',monospace" }}>{v}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0" }}>
            <span style={{ fontSize: "12px", color: C.textSec }}>Status</span>
            <span style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "5px", background: "rgba(52,211,153,0.10)", color: C.green, border: "1px solid rgba(52,211,153,0.22)" }}>Active</span>
          </div>
        </Card>

        {/* ── Danger zone ────────────────────────────────────────────────── */}
        <div style={{ fontSize: "10px", color: C.red, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: "12px", opacity: 0.7 }}>Danger zone</div>
        <Card style={{ border: "1px solid rgba(248,113,113,0.15)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "13px", color: C.textPri, marginBottom: "5px" }}>Delete account</div>
              <div style={{ fontSize: "12px", color: C.textSec, lineHeight: 1.7, maxWidth: "360px" }}>
                Permanently deletes your account and all associated data including analysis history. This cannot be undone.
              </div>
            </div>
            {!showConfirm ? (
              <button
                onClick={() => setShowConfirm(true)}
                style={{ padding: "9px 18px", background: "transparent", border: "1px solid rgba(248,113,113,0.3)", borderRadius: "9px", color: C.red, fontSize: "12px", fontFamily: "'DM Mono',monospace", cursor: "pointer", whiteSpace: "nowrap", transition: "background .15s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(248,113,113,0.07)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
              >
                Delete account
              </button>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "flex-end" }}>
                <div style={{ fontSize: "12px", color: C.red, textAlign: "right" }}>Are you sure? This is irreversible.</div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => { setShowConfirm(false); setDelError(null); }} style={{ padding: "8px 16px", background: "transparent", border: `1px solid ${C.border}`, borderRadius: "8px", color: C.textSec, fontSize: "12px", fontFamily: "'DM Mono',monospace", cursor: "pointer" }}>
                    Cancel
                  </button>
                  <button
                    onClick={deleteAccount}
                    disabled={deleting}
                    style={{ padding: "8px 16px", background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.35)", borderRadius: "8px", color: C.red, fontSize: "12px", fontFamily: "'DM Mono',monospace", cursor: deleting ? "not-allowed" : "pointer", opacity: deleting ? 0.6 : 1 }}
                  >
                    {deleting ? "Deleting…" : "Yes, delete permanently"}
                  </button>
                </div>
                {delError && <div style={{ fontSize: "11px", color: C.red }}>⚠ {delError}</div>}
              </div>
            )}
          </div>
        </Card>

      </div>
    </>
  );
}