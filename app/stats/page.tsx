"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface SessionAnswer {
  questionId: string;
  questionType: string;
  score: number;
  episodeTitle: string;
}

interface GameSession {
  id: string;
  topic: string;
  question_count: number;
  avg_score: number;
  total_score: number;
  answers: SessionAnswer[];
  started_at: string;
  completed_at: string;
}

export default function StatsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/sessions?limit=50")
      .then((r) => r.json())
      .then((data) => setSessions(data.sessions ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="text-gray-400">Loading stats...</div>
      </main>
    );
  }

  const totalGames = sessions.length;
  const totalQuestions = sessions.reduce((s, g) => s + g.question_count, 0);
  const overallAvg = totalGames
    ? Math.round(
        sessions.reduce((s, g) => s + g.avg_score, 0) / totalGames,
      )
    : 0;

  // By topic
  const byTopic: Record<string, { games: number; totalAvg: number }> = {};
  for (const s of sessions) {
    if (!byTopic[s.topic]) byTopic[s.topic] = { games: 0, totalAvg: 0 };
    byTopic[s.topic].games += 1;
    byTopic[s.topic].totalAvg += s.avg_score;
  }

  // By question type (across all sessions)
  const byType: Record<string, { total: number; count: number }> = {};
  for (const s of sessions) {
    for (const a of s.answers) {
      if (!byType[a.questionType])
        byType[a.questionType] = { total: 0, count: 0 };
      byType[a.questionType].total += a.score;
      byType[a.questionType].count += 1;
    }
  }

  // Score trend (most recent first, flip for chart order)
  const recentScores = sessions.slice(0, 20).map((s) => s.avg_score).reverse();

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <button
        onClick={() => router.push("/")}
        className="mb-8 text-sm text-gray-500 hover:text-gray-300"
      >
        &larr; Back to topics
      </button>

      <h1 className="mb-2 text-3xl font-bold">Your Stats</h1>
      <p className="mb-8 text-gray-400">
        Track your learning progress across topics and question types.
      </p>

      {totalGames === 0 ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-8 text-center">
          <p className="mb-4 text-gray-400">No games played yet.</p>
          <button
            onClick={() => router.push("/")}
            className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Start Playing
          </button>
        </div>
      ) : (
        <>
          {/* Overview */}
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 text-center">
              <div className="text-3xl font-bold text-indigo-400">
                {totalGames}
              </div>
              <div className="text-sm text-gray-500">Games Played</div>
            </div>
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 text-center">
              <div className="text-3xl font-bold text-indigo-400">
                {totalQuestions}
              </div>
              <div className="text-sm text-gray-500">Questions Answered</div>
            </div>
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 text-center">
              <div className="text-3xl font-bold text-indigo-400">
                {overallAvg}
              </div>
              <div className="text-sm text-gray-500">Avg Score</div>
            </div>
          </div>

          {/* Score trend (simple bar chart) */}
          {recentScores.length > 1 && (
            <div className="mb-8">
              <h2 className="mb-3 text-lg font-semibold">Score Trend</h2>
              <div className="flex items-end gap-1 rounded-lg border border-gray-800 bg-gray-900/50 p-4">
                {recentScores.map((score, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center">
                    <div
                      className={`w-full rounded-t transition-all ${
                        score >= 70 ? "bg-indigo-500" : "bg-gray-600"
                      }`}
                      style={{ height: `${Math.max(score, 4)}px` }}
                      title={`Game ${i + 1}: ${score}`}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-1 flex justify-between text-xs text-gray-600">
                <span>Oldest</span>
                <span>Most Recent</span>
              </div>
            </div>
          )}

          {/* By topic */}
          <div className="mb-8">
            <h2 className="mb-3 text-lg font-semibold">By Topic</h2>
            <div className="space-y-2">
              {Object.entries(byTopic)
                .sort((a, b) => b[1].games - a[1].games)
                .map(([t, { games, totalAvg }]) => (
                  <div
                    key={t}
                    className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900/50 px-4 py-3"
                  >
                    <span className="text-sm capitalize text-gray-300">
                      {t}
                    </span>
                    <span className="text-sm text-gray-400">
                      {games} games, {Math.round(totalAvg / games)} avg
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* By question type — the experiment insight */}
          <div className="mb-8">
            <h2 className="mb-3 text-lg font-semibold">
              By Question Type
            </h2>
            <p className="mb-3 text-sm text-gray-500">
              Which question types are most educational? Compare your scores.
            </p>
            <div className="space-y-2">
              {Object.entries(byType)
                .sort((a, b) => b[1].count - a[1].count)
                .map(([type, { total, count }]) => {
                  const avg = Math.round(total / count);
                  return (
                    <div
                      key={type}
                      className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900/50 px-4 py-3"
                    >
                      <span className="text-sm capitalize text-gray-300">
                        {type.replace(/_/g, " ")}
                      </span>
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-24 rounded-full bg-gray-800">
                          <div
                            className={`h-2 rounded-full ${
                              avg >= 70 ? "bg-green-500" : "bg-amber-500"
                            }`}
                            style={{ width: `${avg}%` }}
                          />
                        </div>
                        <span className="w-16 text-right text-sm font-semibold text-gray-100">
                          {avg} avg ({count})
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Recent sessions */}
          <div className="mb-8">
            <h2 className="mb-3 text-lg font-semibold">Recent Sessions</h2>
            <div className="space-y-2">
              {sessions.slice(0, 10).map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900/50 px-4 py-3"
                >
                  <div>
                    <span className="text-sm capitalize text-gray-300">
                      {s.topic}
                    </span>
                    <span className="ml-2 text-xs text-gray-600">
                      {s.question_count} questions
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-sm font-semibold ${
                        s.avg_score >= 70
                          ? "text-green-400"
                          : "text-amber-400"
                      }`}
                    >
                      {s.avg_score}
                    </span>
                    <span className="text-xs text-gray-600">
                      {new Date(s.completed_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </main>
  );
}
