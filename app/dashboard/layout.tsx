import Link from "next/link";
import { LayoutDashboard, Mail } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen text-white">

      {/* Sidebar */}

      <aside className="w-64 bg-[#0F1117] border-r border-white/10 p-6">

        <Link href="/" className="flex items-center gap-2 mb-10">

          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
            ↑
          </div>

          <span className="text-xl font-bold gradient-text">
            Inflyio
          </span>

        </Link>

        <nav className="flex flex-col gap-2">

          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-white/5"
          >
            <LayoutDashboard size={18} />
            Dashboard
          </Link>

          <Link
            href="/contact"
            className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-white/5"
          >
            <Mail size={18} />
            Contact
          </Link>

        </nav>

      </aside>

      {/* Main */}

      <main className="flex-1 p-10 overflow-y-auto">
        {children}
      </main>

    </div>
  );
}