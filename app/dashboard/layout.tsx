"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/auth");
      } else {
        setChecking(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace("/auth");
    });

    return () => listener.subscription.unsubscribe();
  }, [router]);

  if (checking) {
    return (
      <div style={{
        minHeight: "100vh", background: "#07080C",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'DM Mono', monospace", color: "#334155", fontSize: "13px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{
            width: "14px", height: "14px",
            border: "2px solid #1E293B", borderTopColor: "#60A5FA",
            borderRadius: "50%", display: "inline-block",
            animation: "spin .7s linear infinite"
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          Verifying session…
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @media (max-width: 767px) {
          .dashboard-main { padding-top: 52px !important; }
        }
      `}</style>
      <div style={{ display: "flex", minHeight: "100vh", background: "#07080C" }}>
        <Sidebar />
        <main className="dashboard-main" style={{ flex: 1, overflowY: "auto", minWidth: 0 }}>
          {children}
        </main>
      </div>
    </>
  );
}