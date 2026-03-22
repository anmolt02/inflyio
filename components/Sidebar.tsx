"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

const MAIN_NAV = [
  { label: "Dashboard", href: "/dashboard",           icon: "◼" },
  { label: "Analytics",  href: "/dashboard/analytics", icon: "▲" },
  { label: "Content",    href: "/dashboard/content",   icon: "▶", badge: "New", badgeType: "new" },
  { label: "Audience",   href: "/dashboard/audience",  icon: "◉" },
];
const PLATFORM_NAV = [
  { label: "YouTube",     href: "/dashboard/youtube",   icon: "▶", iconColor: "#FF4444", badge: "Live", badgeType: "live" },
  { label: "Instagram",   href: "/dashboard/instagram", icon: "◉", iconColor: "#E1306C", badge: "Soon", badgeType: "soon" },
  { label: "X / Twitter", href: "/dashboard/twitter",   icon: "✕", iconColor: "#60A5FA", badge: "Soon", badgeType: "soon" },
];
const OTHER_NAV = [
  { label: "Contact",  href: "/contact",            icon: "✉" },
  { label: "Settings", href: "/dashboard/settings", icon: "⚙" },
];

function NavBadge({ type, label }: { type: string; label: string }) {
  const map: Record<string, { bg: string; color: string; text: string }> = {
    new:  { bg: "rgba(96,165,250,0.12)",  color: "#60A5FA", text: label },
    live: { bg: "rgba(52,211,153,0.10)",  color: "#34D399", text: "●"   },
    soon: { bg: "rgba(255,255,255,0.05)", color: "#475569", text: label },
  };
  const s = map[type] ?? map.soon;
  return (
    <span style={{
      marginLeft: "auto", fontSize: "9px", padding: "2px 6px",
      borderRadius: "4px", fontWeight: 500,
      background: s.bg, color: s.color,
      fontFamily: "'DM Mono', monospace",
    }}>{s.text}</span>
  );
}

function NavItem({
  href, label, icon, iconColor, badge, badgeType, active, onClick,
}: {
  href: string; label: string; icon: string;
  iconColor?: string; badge?: string; badgeType?: string;
  active: boolean; onClick?: () => void;
}) {
  return (
    <Link href={href} style={{ textDecoration: "none" }} onClick={onClick}>
      <div
        style={{
          display: "flex", alignItems: "center", gap: "11px",
          padding: "10px 12px", margin: "0 8px", borderRadius: "9px",
          background: active ? "rgba(96,165,250,0.10)" : "transparent",
          border: `1px solid ${active ? "rgba(96,165,250,0.22)" : "transparent"}`,
          color: active ? "#60A5FA" : "#64748B",
          fontSize: "13px", fontFamily: "'DM Mono', monospace",
          cursor: "pointer", transition: "background .15s, color .15s",
        }}
        onMouseEnter={(e) => { if (!active) { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLElement).style.color = "#94A3B8"; } }}
        onMouseLeave={(e) => { if (!active) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#64748B"; } }}
      >
        <span style={{ width: "16px", height: "16px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", color: active ? "#60A5FA" : (iconColor ?? "inherit") }}>
          {icon}
        </span>
        {label}
        {badge && badgeType && <NavBadge type={badgeType} label={badge} />}
      </div>
    </Link>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <div style={{ fontSize: "9px", color: "#334155", letterSpacing: ".12em", textTransform: "uppercase", padding: "10px 20px 5px", fontFamily: "'DM Mono', monospace" }}>
      {text}
    </div>
  );
}

function Divider() {
  return <div style={{ height: "1px", background: "rgba(255,255,255,0.05)", margin: "8px 16px" }} />;
}

// ─── Sidebar inner content (shared between desktop + mobile drawer) ───────────
function SidebarContent({ user, isActive, onNavClick }: {
  user: User | null;
  isActive: (href: string) => boolean;
  onNavClick?: () => void;
}) {
  const displayName = user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "Creator";
  const initials    = displayName.slice(0, 2).toUpperCase();

  return (
    <>
      {/* Logo */}
      <div style={{ padding: "0 18px 3px", display: "flex", alignItems: "center", gap: "9px" }}>
        <div style={{ width: "30px", height: "30px", borderRadius: "9px", flexShrink: 0, background: "linear-gradient(135deg, #60A5FA, #3B82F6)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Syne', sans-serif", fontWeight: 800, color: "#07080C", fontSize: "15px" }}>I</div>
        <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "16px", color: "#F1F5F9" }}>inflyio</span>
      </div>
      <div style={{ fontSize: "9px", color: "#334155", letterSpacing: ".1em", textTransform: "uppercase", padding: "0 18px 22px", fontFamily: "'DM Mono', monospace" }}>
        Creator Intelligence
      </div>

      <SectionLabel text="Main" />
      {MAIN_NAV.map((n) => <NavItem key={n.href} {...n} active={isActive(n.href)} onClick={onNavClick} />)}
      <Divider />

      <SectionLabel text="Platforms" />
      {PLATFORM_NAV.map((n) => <NavItem key={n.href} {...n} active={isActive(n.href)} onClick={onNavClick} />)}
      <Divider />

      <SectionLabel text="Other" />
      {OTHER_NAV.map((n) => <NavItem key={n.href} {...n} active={isActive(n.href)} onClick={onNavClick} />)}

      {/* User card */}
      <div style={{ marginTop: "auto", padding: "16px 10px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "9px", padding: "10px 12px", borderRadius: "9px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ width: "28px", height: "28px", borderRadius: "7px", flexShrink: 0, background: "linear-gradient(135deg, rgba(96,165,250,0.25), rgba(96,165,250,0.07))", border: "1px solid rgba(96,165,250,0.22)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", color: "#60A5FA", fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>
            {initials}
          </div>
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontSize: "11px", color: "#F1F5F9", fontFamily: "'Syne', sans-serif", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {displayName}
            </div>
            <div style={{ fontSize: "9px", color: "#334155", marginTop: "1px" }}>
              {user ? "Free Plan" : "Not signed in"}
            </div>
          </div>
        </div>
        {user && (
          <button
            onClick={() => supabase.auth.signOut()}
            style={{ width: "100%", marginTop: "6px", padding: "8px", borderRadius: "8px", background: "transparent", border: "1px solid rgba(255,255,255,0.06)", color: "#334155", fontSize: "11px", fontFamily: "'DM Mono', monospace", cursor: "pointer", transition: "color .15s, border-color .15s" }}
            onMouseEnter={(e) => { (e.currentTarget).style.color = "#F87171"; (e.currentTarget).style.borderColor = "rgba(248,113,113,0.25)"; }}
            onMouseLeave={(e) => { (e.currentTarget).style.color = "#334155"; (e.currentTarget).style.borderColor = "rgba(255,255,255,0.06)"; }}
          >
            Sign out
          </button>
        )}
      </div>
    </>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function Sidebar() {
  const pathname    = usePathname();
  const [user, setUser]       = useState<User | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => listener.subscription.unsubscribe();
  }, []);

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  return (
    <>
      <style>{`
        @media (min-width: 768px) {
          .sidebar-desktop { display: flex !important; }
          .mobile-topbar   { display: none !important; }
        }
        @media (max-width: 767px) {
          .sidebar-desktop { display: none !important; }
          .mobile-topbar   { display: flex !important; }
        }
      `}</style>

      {/* ── Desktop sidebar ──────────────────────────────────────────── */}
      <aside
        className="sidebar-desktop"
        style={{
          width: "220px", flexShrink: 0,
          background: "#0A0B0F",
          borderRight: "1px solid rgba(255,255,255,0.055)",
          flexDirection: "column",
          padding: "20px 0",
          position: "sticky", top: 0, height: "100vh",
          overflowY: "auto",
        }}
      >
        <SidebarContent user={user} isActive={isActive} />
      </aside>

      {/* ── Mobile top bar ───────────────────────────────────────────── */}
      <div
        className="mobile-topbar"
        style={{
          display: "none", // overridden by media query
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          height: "52px",
          background: "#0A0B0F",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "26px", height: "26px", borderRadius: "7px", background: "linear-gradient(135deg,#60A5FA,#3B82F6)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Syne',sans-serif", fontWeight: 800, color: "#07080C", fontSize: "13px" }}>I</div>
          <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "15px", color: "#F1F5F9" }}>inflyio</span>
        </div>

        {/* Hamburger button */}
        <button
          onClick={() => setDrawerOpen(!drawerOpen)}
          style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "7px", padding: "6px 10px", cursor: "pointer", color: "#94A3B8", fontSize: "16px", lineHeight: 1 }}
        >
          {drawerOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* ── Mobile drawer overlay ────────────────────────────────────── */}
      {drawerOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 99, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ── Mobile drawer panel ──────────────────────────────────────── */}
      <div style={{
        position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 100,
        width: "260px",
        background: "#0A0B0F",
        borderRight: "1px solid rgba(255,255,255,0.07)",
        display: "flex", flexDirection: "column",
        padding: "20px 0",
        overflowY: "auto",
        transform: drawerOpen ? "translateX(0)" : "translateX(-100%)",
        transition: "transform .28s cubic-bezier(.4,0,.2,1)",
      }}>
        <SidebarContent user={user} isActive={isActive} onNavClick={() => setDrawerOpen(false)} />
      </div>
    </>
  );
}
