export default function Sidebar() {
  return (
    <div className="w-64 min-h-screen bg-[#1A1D26] p-6 text-white">
      <h2 className="text-2xl font-bold mb-10">inflyio</h2>

      <nav className="space-y-4">
        <a href="/dashboard" className="block hover:text-[#5B7CFA]">
          Dashboard
        </a>
        <a href="#" className="block hover:text-[#5B7CFA]">
          Platforms
        </a>
        <a href="#" className="block hover:text-[#5B7CFA]">
          Reports
        </a>
        <a href="#" className="block hover:text-[#5B7CFA]">
          Billing
        </a>
        <a href="#" className="block hover:text-[#5B7CFA]">
          Settings
        </a>
      </nav>
    </div>
  );
}
