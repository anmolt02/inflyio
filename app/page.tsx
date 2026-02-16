export default function Home() {
  return (
    <main className="min-h-screen bg-[#0F1117] text-white flex flex-col items-center justify-center px-6">
      <h1 className="text-5xl font-bold text-center mb-6">
        Know Your Influence.
      </h1>

      <p className="text-gray-400 text-lg text-center max-w-xl mb-8">
        Inflyio helps creators measure their true influence using AI-powered analytics.
      </p>

      <button className="bg-[#5B7CFA] hover:bg-blue-600 px-8 py-4 rounded-xl text-white font-medium">
        Check My Score
      </button>
    </main>
  );
}
