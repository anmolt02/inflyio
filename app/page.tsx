import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">

      <h1 className="text-5xl font-semibold tracking-tight mb-6">
        Welcome to Inflyio
      </h1>

      <p className="text-gray-400 max-w-xl mb-10">
        Influence Intelligence Platform that analyzes YouTube creators
        and calculates a proprietary Influence Score.
      </p>

      <Link
        href="/dashboard"
        className="px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-colors font-medium text-white"
      >
        Go to Dashboard
      </Link>

    </main>
  );
}