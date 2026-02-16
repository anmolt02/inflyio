import Sidebar from "@/components/Sidebar";

export default function Dashboard() {
  return (
    <div className="flex bg-[#0F1117] text-white">
      <Sidebar />

      <div className="flex-1 p-10 space-y-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>

        <div className="bg-[#1A1D26] p-10 rounded-2xl">
          <h2 className="text-xl mb-4">Overall Influence Score</h2>
          <div className="text-6xl font-bold text-[#5B7CFA]">78</div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-[#1A1D26] p-6 rounded-xl">
            Engagement Score
            <div className="text-3xl mt-2 text-[#9B5DE5]">82</div>
          </div>

          <div className="bg-[#1A1D26] p-6 rounded-xl">
            Growth Score
            <div className="text-3xl mt-2 text-[#00C2A8]">74</div>
          </div>
        </div>
      </div>
    </div>
  );
}
