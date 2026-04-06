"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface LeaderboardEntry {
  id: string;
  player_name: string;
  topic: string;
  avg_score: number;
  question_count: number;
  completed_at: string;
}

const topics = [
  { slug: "overall", label: "Overall" },
  { slug: "growth", label: "Growth" },
  { slug: "product", label: "Product" },
  { slug: "leadership", label: "Leadership" },
  { slug: "strategy", label: "Strategy" },
  { slug: "engineering", label: "Engineering" },
  { slug: "random", label: "Random" },
];

function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000,
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function isRecent(dateStr: string): boolean {
  const hours = (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60);
  return hours < 24;
}

export default function LeaderboardPage() {
  const [activeTopic, setActiveTopic] = useState("overall");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async (topic: string) => {
    setLoading(true);
    try {
      const param = topic === "overall" ? "" : `?topic=${topic}`;
      const res = await fetch(`/api/leaderboard${param}`);
      const data = await res.json();
      setEntries(data.entries ?? []);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard(activeTopic);
  }, [activeTopic, fetchLeaderboard]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <Link
        href="/"
        className="mb-8 inline-block text-sm text-gray-500 hover:text-gray-300"
      >
        &larr; Back to topics
      </Link>

      <h1 className="mb-2 text-3xl font-bold">Leaderboard</h1>
      <p className="mb-8 text-gray-400">
        Top scores across Podcast Quest players.
      </p>

      {/* Topic tabs */}
      <div className="mb-8 flex flex-wrap gap-2">
        {topics.map((t) => (
          <button
            key={t.slug}
            onClick={() => setActiveTopic(t.slug)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTopic === t.slug
                ? "bg-indigo-600 text-white"
                : "border border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-500 hover:text-gray-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-12 text-center text-gray-500">Loading...</div>
      ) : entries.length === 0 ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-12 text-center">
          <p className="mb-2 text-lg text-gray-400">No scores yet</p>
          <p className="text-sm text-gray-600">
            Play a quiz and add your name to be the first on the board!
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-800">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3 w-12">#</th>
                <th className="px-4 py-3">Player</th>
                {activeTopic === "overall" && (
                  <th className="px-4 py-3">Topic</th>
                )}
                <th className="px-4 py-3 text-right">Score</th>
                <th className="px-4 py-3 text-right">Questions</th>
                <th className="px-4 py-3 text-right">When</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, i) => (
                <tr
                  key={entry.id}
                  className={`border-b border-gray-800/50 transition-colors ${
                    isRecent(entry.completed_at)
                      ? "bg-indigo-500/5"
                      : "bg-gray-900/30"
                  } ${i === 0 ? "bg-amber-500/5" : ""}`}
                >
                  <td className="px-4 py-3 text-sm font-semibold text-gray-500">
                    {i === 0 ? (
                      <span className="text-amber-400">1</span>
                    ) : i === 1 ? (
                      <span className="text-gray-300">2</span>
                    ) : i === 2 ? (
                      <span className="text-amber-700">3</span>
                    ) : (
                      i + 1
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-100">
                      {entry.player_name}
                    </span>
                    {isRecent(entry.completed_at) && (
                      <span className="ml-2 rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs text-indigo-400">
                        new
                      </span>
                    )}
                  </td>
                  {activeTopic === "overall" && (
                    <td className="px-4 py-3 text-sm capitalize text-gray-400">
                      {entry.topic}
                    </td>
                  )}
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`font-semibold ${
                        entry.avg_score >= 80
                          ? "text-green-400"
                          : entry.avg_score >= 50
                            ? "text-amber-400"
                            : "text-red-400"
                      }`}
                    >
                      {entry.avg_score}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-500">
                    {entry.question_count}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-500">
                    {timeAgo(entry.completed_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
