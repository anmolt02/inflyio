"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

// ─── Nav structure ────────────────────────────────────────────────────────────
const MAIN_NAV = [
  { label: "Dashboard", href: "/dashboard", icon: "◼" },
  { label: "Analytics",  href: "/dashboard/analytics", icon: "▲" },
  { label: "Content",    href: "/dashboard/content",   icon: "▶", badge: "New", badgeType: "new" },
  { label: "Audience",   href: "/dashboard/audience",  icon: "◉" },
];

const PLATFORM_NAV = [
  { label: "YouTube",   href: "/dashboard/youtube",   icon: "▶", iconColor: "#FF4444", badge: "Live", badgeType: "live" },
  { label: "Instagram", href: "/dashboard/instagram", icon: "◉", iconColor: "#E1306C", badge: "Soon", badgeType: "soon" },
  { label: "X / Twitter", href: "/dashboard/twitter", icon: "✕", iconColor: "#1DA1F2", badge: "Soon", badgeType: "soon" },
];

const OTHER_NAV = [
  { label: "Contact",  href: "/contact",           icon: "✉" },
  { label: "Settings", href: "/dashboard/settings", icon: "⚙" },
];

// ─── Badge renderer ───────────────────────────────────────────────────────────
function NavBadge({ type, label }: { type: string; label: string }) {
  const styles: Record<string, { background: string; color: string; content?: string }> = {
    new:  { background: "rgba(245,166,35,.12)", color: "#F5A623" },
    live: { background: "rgba(52,211,153,.1)",  color: "#34D399", content: "●" },
    soon: { background: "rgba(255,255,255,.05)", color: "#4B5563" },
  };
  const s = styles[type] ?? styles.soon;
  return (
    <span style={{
      marginLeft: "auto", fontSize: "9px", padding: "2px 6px",
      borderRadius: "4px", fontWeight: 500,
      background: s.background, color: s.color,
      fontFamily: "'DM Mono', monospace",
    }}>
      {s.content ? s.content : label}
    </span>
  );
}

// ─── Single nav item ──────────────────────────────────────────────────────────
function NavItem({
  href, label, icon, iconColor, badge, badgeType, active,
}: {
  href: string; label: string; icon: string;
  iconColor?: string; badge?: string; badgeType?: string; active: boolean;
}) {
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: "11px",
        padding: "9px 12px", margin: "0 8px", borderRadius: "9px",
        background: active ? "rgba(245,166,35,.10)" : "transparent",
        border: `1px solid ${active ? "rgba(245,166,35,.22)" : "transparent"}`,
        color: active ? "#F5A623" : "#6B7280",
        fontSize: "12px", fontFamily: "'DM Mono', monospace",
        cursor: "pointer",
        transition: "background .15s, color .15s, border-color .15s",
      }}
        onMouseEnter={(e) => { if (!active) { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,.04)"; (e.currentTarget as HTMLDivElement).style.color = "#9CA3AF"; } }}
        onMouseLeave={(e) => { if (!active) { (e.currentTarget as HTMLDivElement).style.background = "transparent"; (e.currentTarget as HTMLDivElement).style.color = "#6B7280"; } }}
      >
        <span style={{
          width: "16px", height: "16px",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "11px", flexShrink: 0,
          color: active ? "#F5A623" : (iconColor ?? "inherit"),
        }}>
          {icon}
        </span>
        {label}
        {badge && badgeType && <NavBadge type={badgeType} label={badge} />}
      </div>
    </Link>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────
function SectionLabel({ text }: { text: string }) {
  return (
    <div style={{
      fontSize: "9px", color: "#374151",
      letterSpacing: ".12em", textTransform: "uppercase",
      padding: "10px 20px 5px",
      fontFamily: "'DM Mono', monospace",
    }}>
      {text}
    </div>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────
function Divider() {
  return <div style={{ height: "1px", background: "rgba(255,255,255,.05)", margin: "8px 16px" }} />;
}

// ─── Main Sidebar ─────────────────────────────────────────────────────────────
export default function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // Derive initials + display name from user
  const displayName = user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "Creator";
  const initials = displayName.slice(0, 2).toUpperCase();

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  return (
    <aside style={{
      width: "220px", flexShrink: 0,
      background: "#0C0C0F",
      borderRight: "1px solid rgba(255,255,255,0.055)",
      display: "flex", flexDirection: "column",
      padding: "20px 0",
      position: "sticky", top: 0, height: "100vh",
      overflowY: "auto",
    }}>

      {/* ── Logo ─────────────────────────────────────────────────────── */}
      <div style={{ padding: "0 18px 4px", display: "flex", alignItems: "center", gap: "9px" }}>
        <div style={{
          width: "30px", height: "30px", borderRadius: "9px", flexShrink: 0,
          background: "linear-gradient(135deg, #F5A623, #C97B00)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'Syne', sans-serif", fontWeight: 800,
          color: "#07070A", fontSize: "15px",
        }}>
          I
        </div>
        <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "16px", color: "#F9FAFB" }}>
          inflyio
        </span>
      </div>
      <div style={{ fontSize: "9px", color: "#374151", letterSpacing: ".1em", textTransform: "uppercase", padding: "0 18px 22px", fontFamily: "'DM Mono', monospace" }}>
        Creator Intelligence
      </div>

      {/* ── Main nav ─────────────────────────────────────────────────── */}
      <SectionLabel text="Main" />
      {MAIN_NAV.map((n) => (
        <NavItem key={n.href} {...n} active={isActive(n.href)} />
      ))}

      <Divider />

      {/* ── Platforms ────────────────────────────────────────────────── */}
      <SectionLabel text="Platforms" />
      {PLATFORM_NAV.map((n) => (
        <NavItem key={n.href} {...n} active={isActive(n.href)} />
      ))}

      <Divider />

      {/* ── Other ────────────────────────────────────────────────────── */}
      <SectionLabel text="Other" />
      {OTHER_NAV.map((n) => (
        <NavItem key={n.href} {...n} active={isActive(n.href)} />
      ))}

      {/* ── User card (bottom) ────────────────────────────────────────── */}
      <div style={{ marginTop: "auto", padding: "16px 10px 0" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: "9px",
          padding: "10px 12px", borderRadius: "9px",
          background: "rgba(255,255,255,.03)",
          border: "1px solid rgba(255,255,255,.06)",
        }}>
          <div style={{
            width: "28px", height: "28px", borderRadius: "7px", flexShrink: 0,
            background: "linear-gradient(135deg, rgba(245,166,35,.28), rgba(245,166,35,.08))",
            border: "1px solid rgba(245,166,35,.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "11px", color: "#F5A623",
            fontFamily: "'Syne', sans-serif", fontWeight: 700,
          }}>
            {initials}
          </div>
          <div style={{ overflow: "hidden" }}>
            <div style={{
              fontSize: "11px", color: "#F9FAFB",
              fontFamily: "'Syne', sans-serif", fontWeight: 600,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {displayName}
            </div>
            <div style={{ fontSize: "9px", color: "#4B5563", marginTop: "1px" }}>
              {user ? "Free Plan" : "Not signed in"}
            </div>
          </div>
        </div>

        {/* Sign out */}
        {user && (
          <button
            onClick={() => supabase.auth.signOut()}
            style={{
              width: "100%", marginTop: "6px",
              padding: "8px", borderRadius: "8px",
              background: "transparent",
              border: "1px solid rgba(255,255,255,.06)",
              color: "#374151", fontSize: "11px",
              fontFamily: "'DM Mono', monospace",
              cursor: "pointer",
              transition: "color .15s, border-color .15s",
            }}
            onMouseEnter={(e) => { (e.currentTarget).style.color = "#F87171"; (e.currentTarget).style.borderColor = "rgba(248,113,113,.25)"; }}
            onMouseLeave={(e) => { (e.currentTarget).style.color = "#374151"; (e.currentTarget).style.borderColor = "rgba(255,255,255,.06)"; }}
          >
            Sign out
          </button>
        )}
      </div>
    </aside>
  );
}
