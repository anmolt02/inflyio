import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
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
