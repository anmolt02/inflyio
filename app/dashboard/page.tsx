"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Dashboard() {

  const [input, setInput] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchScore = async () => {

    if (!input) return;

    try {

      setLoading(true);
      setError(null);
      setData(null);

      // 👇 get logged-in user
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      const response = await fetch(
        `/api/youtube-score?name=${encodeURIComponent(input)}`,
        {
          headers: {
            "x-user-id": user?.id || "",
          },
        }
      );

      const result = await response.json();

      if (!response.ok || result.error) {
        setError(result.error || "Something went wrong");
        return;
      }

      setData(result);

    } catch (err) {

      setError("Failed to analyze channel.");

    } finally {

      setLoading(false);

    }

  };

  return (

    <div className="max-w-6xl mx-auto space-y-10">

      {/* HERO */}

      <div className="glass p-10 rounded-xl">

        <h1 className="text-4xl font-bold mb-3">

          Discover <span className="gradient-text">Top Creators</span>

        </h1>

        <p className="text-gray-400 max-w-xl">

          AI powered influence scoring for YouTube creators.
          Analyze performance and identify high-impact influencers instantly.

        </p>

      </div>

      {/* STATS */}

      <div className="grid md:grid-cols-3 gap-6">

        <div className="glass p-6 rounded-xl">
          <p className="text-gray-400 text-sm">Analyzed Channels</p>
          <p className="text-3xl font-bold mt-1">—</p>
        </div>

        <div className="glass p-6 rounded-xl">
          <p className="text-gray-400 text-sm">Average Score</p>
          <p className="text-3xl font-bold mt-1">—</p>
        </div>

        <div className="glass p-6 rounded-xl">
          <p className="text-gray-400 text-sm">Top Score</p>
          <p className="text-3xl font-bold mt-1">—</p>
        </div>

      </div>

      {/* SEARCH */}

      <div className="glass p-6 rounded-xl">

        <div className="flex gap-4">

          <input
            type="text"
            placeholder="Search YouTube creator..."
            className="flex-1 p-4 rounded-xl bg-[#0F1117] border border-white/10"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />

          <button
            onClick={fetchScore}
            className="px-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition font-medium"
          >
            {loading ? "Analyzing..." : "Analyze"}
          </button>

        </div>

        {error && (
          <p className="text-red-400 mt-4">{error}</p>
        )}

      </div>

      {/* RESULTS */}

      {data && (

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">

          {/* SCORE */}

          <div className="glass p-8 rounded-xl text-center">

            <p className="text-gray-400 uppercase text-sm tracking-wide">
              Influence Score
            </p>

            <p className="text-6xl font-bold mt-4">
              {data.influenceScore}
            </p>

            <div className="mt-4 inline-block px-4 py-2 bg-indigo-600/20 text-indigo-400 rounded-full text-sm">
              {data.tier}
            </div>

          </div>

          {/* METRICS */}

          <div className="glass p-6 rounded-xl space-y-4">

            <Metric label="Subscribers" value={data.subscribers} />
            <Metric label="Total Views" value={data.totalViews} />
            <Metric label="Videos" value={data.videos} />
            <Metric label="Avg Views / Video" value={data.avgViews} />
            <Metric label="Engagement Ratio" value={data.engagementRatio} />

          </div>

          {/* PERFORMANCE */}

          <div className="glass p-6 rounded-xl space-y-6">

            <Progress label="Scale Position" value={data.scalePosition} />
            <Progress label="Consistency" value={data.consistencyScore} />
            <Progress label="Activity" value={data.activityScore} />

          </div>

        </div>

      )}

    </div>

  );

}

function Metric({ label, value }: { label: string; value: any }) {

  return (

    <div className="flex justify-between border-b border-white/10 pb-2">

      <span className="text-gray-400">{label}</span>
      <span>{value}</span>

    </div>

  );

}

function Progress({ label, value }: { label: string; value: number }) {

  return (

    <div>

      <div className="flex justify-between text-sm mb-2">

        <span>{label}</span>
        <span>{value}%</span>

      </div>

      <div className="bg-white/10 h-2 rounded-full">

        <div
          className="progress-bar"
          style={{ width: `${value}%` }}
        />

      </div>

    </div>

  );

}