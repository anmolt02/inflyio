"use client";

import { useState } from "react";

export default function Dashboard() {
  const [input, setInput] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchScore = async () => {
    if (!input) return;

    setLoading(true);

    const response = await fetch(
  `/api/youtube-score?name=${encodeURIComponent(input)}`
);

    const result = await response.json();
    setData(result);

    setLoading(false);
  };

  return (
    <div className="min-h-screen px-8 py-16 max-w-6xl mx-auto">

      {/* Header */}
      <div className="mb-16">
        <h1 className="text-4xl font-semibold tracking-tight">
          Inflyio
        </h1>
        <p className="text-gray-400 mt-2">
          Influence Intelligence Platform
        </p>
      </div>

      {/* Search */}
      <div className="card p-8 mb-12">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Enter YouTube channel name"
            className="flex-1 p-4 rounded-xl input-dark focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />

          <button
            onClick={fetchScore}
            className="px-8 rounded-xl btn-primary font-medium"
          >
            {loading ? "Analyzing..." : "Analyze"}
          </button>
        </div>
      </div>

      {data && !data.error && (
        <div className="grid md:grid-cols-2 gap-8">

          {/* Score Section */}
          <div className="card p-10">
            <div className="text-sm text-gray-400 uppercase tracking-wide">
              Influence Score
            </div>

            <div className="text-6xl font-semibold mt-4">
              {data.influence_score}
            </div>

            <div className="mt-6 inline-block px-4 py-2 bg-indigo-600/20 text-indigo-400 rounded-full text-sm">
              {data.tier}
            </div>
          </div>

          {/* Metrics */}
          <div className="card p-8 space-y-4">
            <Metric label="Subscribers" value={data.subscribers} />
            <Metric label="Total Views" value={data.total_views} />
            <Metric label="Videos" value={data.video_count} />
            <Metric label="Avg Views / Video" value={data.avg_views_per_video} />
            <Metric label="Engagement Ratio" value={data.engagement_ratio} />
          </div>

          {/* Sub Scores */}
          <div className="card p-8 md:col-span-2 space-y-6">
            <Progress label="Scale Position" value={data.scale_position} />
            <Progress label="Consistency" value={data.consistency_score} />
            <Progress label="Activity" value={data.activity_score} />
          </div>

        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex justify-between border-b border-gray-800 pb-3">
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
      <div className="progress-track h-2 rounded-full">
        <div
          className="progress-fill h-2 rounded-full transition-all duration-500"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
