"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface EpisodeContext {
  id: string;
  title: string;
  podcast: string;
  key_topics: string[];
  quotes: string[];
  key_takeaways: string[];
}

interface Question {
  id: string;
  type: string;
  format: "multiple_choice" | "open";
  text: string;
  options: string[] | null;
  topic: string;
  episode: EpisodeContext | null;
  secondEpisode: EpisodeContext | null;
}

interface FeedbackData {
  score: number;
  feedback: string;
  correctAnswer: string;
  sourceQuote: string | null;
}

interface AnswerRecord {
  questionId: string;
  questionText: string;
  questionType: string;
  playerAnswer: string;
  score: number;
  feedback: string;
  correctAnswer: string;
  episodeTitle: string;
}

type GamePhase = "setup" | "loading" | "playing" | "feedback" | "finished";

export default function GameClient({ topic }: { topic: string }) {
  const router = useRouter();
  const [phase, setPhase] = useState<GamePhase>("setup");
  const [questionCount, setQuestionCount] = useState(5);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [openAnswer, setOpenAnswer] = useState("");
  const [feedbackData, setFeedbackData] = useState<FeedbackData | null>(null);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [evaluating, setEvaluating] = useState(false);

  const currentQuestion = questions[currentIndex] ?? null;

  const startGame = useCallback(async () => {
    setPhase("loading");
    try {
      const res = await fetch(
        `/api/questions?topic=${topic}&count=${questionCount}`,
      );
      const data = await res.json();
      if (!data.questions?.length) {
        alert("No questions available for this topic yet. Try another topic.");
        setPhase("setup");
        return;
      }
      setQuestions(data.questions);
      setCurrentIndex(0);
      setAnswers([]);
      setPhase("playing");
    } catch {
      alert("Failed to load questions. Please try again.");
      setPhase("setup");
    }
  }, [topic, questionCount]);

  const submitAnswer = useCallback(async () => {
    if (!currentQuestion) return;

    const playerAnswer =
      currentQuestion.format === "multiple_choice"
        ? selectedOption ?? ""
        : openAnswer;

    if (!playerAnswer.trim()) return;

    setEvaluating(true);
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          playerAnswer,
        }),
      });
      const result: FeedbackData = await res.json();
      setFeedbackData(result);

      setAnswers((prev) => [
        ...prev,
        {
          questionId: currentQuestion.id,
          questionText: currentQuestion.text,
          questionType: currentQuestion.type,
          playerAnswer,
          score: result.score,
          feedback: result.feedback,
          correctAnswer: result.correctAnswer,
          episodeTitle: currentQuestion.episode?.title ?? "Unknown",
        },
      ]);

      setPhase("feedback");
    } catch {
      alert("Failed to evaluate answer. Please try again.");
    } finally {
      setEvaluating(false);
    }
  }, [currentQuestion, selectedOption, openAnswer]);

  const nextQuestion = useCallback(() => {
    setSelectedOption(null);
    setOpenAnswer("");
    setFeedbackData(null);

    if (currentIndex + 1 >= questions.length) {
      setPhase("finished");
    } else {
      setCurrentIndex((i) => i + 1);
      setPhase("playing");
    }
  }, [currentIndex, questions.length]);

  const totalScore = answers.reduce((sum, a) => sum + a.score, 0);
  const avgScore = answers.length ? Math.round(totalScore / answers.length) : 0;

  // Setup screen
  if (phase === "setup") {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16">
        <button
          onClick={() => router.push("/")}
          className="mb-8 text-sm text-gray-500 hover:text-gray-300"
        >
          &larr; Back to topics
        </button>
        <h1 className="mb-2 text-3xl font-bold capitalize">{topic} Quiz</h1>
        <p className="mb-8 text-gray-400">
          Choose how many questions you want to tackle.
        </p>

        <div className="mb-8 flex gap-3">
          {[5, 10, 20].map((n) => (
            <button
              key={n}
              onClick={() => setQuestionCount(n)}
              className={`rounded-lg px-6 py-3 text-lg font-semibold transition-colors ${
                questionCount === n
                  ? "bg-indigo-600 text-white"
                  : "border border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500"
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        <button
          onClick={startGame}
          className="rounded-xl bg-indigo-600 px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-indigo-500"
        >
          Start Quiz
        </button>
      </main>
    );
  }

  // Loading
  if (phase === "loading") {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="text-lg text-gray-400">Loading questions...</div>
      </main>
    );
  }

  // Playing — show current question
  if (phase === "playing" && currentQuestion) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16">
        {/* Progress bar */}
        <div className="mb-6 flex items-center justify-between text-sm text-gray-500">
          <span>
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span className="capitalize">
            {currentQuestion.type.replace(/_/g, " ")}
          </span>
        </div>
        <div className="mb-8 h-1 rounded-full bg-gray-800">
          <div
            className="h-1 rounded-full bg-indigo-500 transition-all"
            style={{
              width: `${((currentIndex + 1) / questions.length) * 100}%`,
            }}
          />
        </div>

        {/* Episode context */}
        {currentQuestion.episode && (
          <div className="mb-6 rounded-lg border border-gray-800 bg-gray-900/50 p-4">
            <div className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-500">
              Source Episode
            </div>
            <div className="text-sm font-medium text-gray-300">
              {currentQuestion.episode.title}
            </div>
            <div className="text-xs text-gray-500">
              {currentQuestion.episode.podcast}
            </div>
          </div>
        )}

        {/* Question */}
        <h2 className="mb-6 text-xl font-semibold leading-relaxed">
          {currentQuestion.text}
        </h2>

        {/* MC options */}
        {currentQuestion.format === "multiple_choice" &&
          currentQuestion.options && (
            <div className="mb-6 space-y-3">
              {currentQuestion.options.map((option) => {
                const letter = option.trim().charAt(0);
                return (
                  <button
                    key={option}
                    onClick={() => setSelectedOption(letter)}
                    className={`w-full rounded-lg border p-4 text-left transition-colors ${
                      selectedOption === letter
                        ? "border-indigo-500 bg-indigo-500/10 text-white"
                        : "border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500"
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          )}

        {/* Open answer */}
        {currentQuestion.format === "open" && (
          <textarea
            value={openAnswer}
            onChange={(e) => setOpenAnswer(e.target.value)}
            placeholder="Type your answer..."
            rows={4}
            className="mb-6 w-full rounded-lg border border-gray-700 bg-gray-900 p-4 text-gray-100 placeholder-gray-600 focus:border-indigo-500 focus:outline-none"
          />
        )}

        <button
          onClick={submitAnswer}
          disabled={
            evaluating ||
            (currentQuestion.format === "multiple_choice"
              ? !selectedOption
              : !openAnswer.trim())
          }
          className="rounded-xl bg-indigo-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {evaluating ? "Evaluating..." : "Submit Answer"}
        </button>
      </main>
    );
  }

  // Feedback
  if (phase === "feedback" && feedbackData && currentQuestion) {
    const isCorrect = feedbackData.score >= 70;
    return (
      <main className="mx-auto max-w-2xl px-4 py-16">
        {/* Score badge */}
        <div
          className={`mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
            isCorrect
              ? "bg-green-500/10 text-green-400"
              : "bg-red-500/10 text-red-400"
          }`}
        >
          <span className="text-lg">{isCorrect ? "+" : ""}{feedbackData.score}</span>
          <span>/ 100</span>
        </div>

        {/* Feedback */}
        <p className="mb-6 text-lg">{feedbackData.feedback}</p>

        {/* Correct answer */}
        <div className="mb-4 rounded-lg border border-gray-800 bg-gray-900/50 p-4">
          <div className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-500">
            {isCorrect ? "Full Context" : "Correct Answer"}
          </div>
          <p className="text-sm text-gray-300">{feedbackData.correctAnswer}</p>
        </div>

        {/* Source quote */}
        {feedbackData.sourceQuote && (
          <div className="mb-6 rounded-lg border border-gray-800 bg-gray-900/50 p-4">
            <div className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-500">
              From the Episode
            </div>
            <p className="text-sm italic text-gray-400">
              &ldquo;{feedbackData.sourceQuote}&rdquo;
            </p>
            {currentQuestion.episode && (
              <p className="mt-2 text-xs text-gray-600">
                &mdash; {currentQuestion.episode.title} ({currentQuestion.episode.podcast})
              </p>
            )}
          </div>
        )}

        <button
          onClick={nextQuestion}
          className="rounded-xl bg-indigo-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-indigo-500"
        >
          {currentIndex + 1 >= questions.length
            ? "See Results"
            : "Next Question"}
        </button>
      </main>
    );
  }

  // Finished — results
  if (phase === "finished") {
    const byType: Record<string, { total: number; count: number }> = {};
    for (const a of answers) {
      if (!byType[a.questionType]) byType[a.questionType] = { total: 0, count: 0 };
      byType[a.questionType].total += a.score;
      byType[a.questionType].count += 1;
    }

    return (
      <main className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="mb-2 text-3xl font-bold">Quiz Complete!</h1>
        <p className="mb-8 text-gray-400 capitalize">{topic} quiz</p>

        {/* Score */}
        <div className="mb-8 rounded-xl border border-gray-800 bg-gray-900 p-8 text-center">
          <div className="mb-1 text-5xl font-bold text-indigo-400">
            {avgScore}
          </div>
          <div className="text-sm text-gray-500">
            Average Score ({answers.length} questions)
          </div>
        </div>

        {/* Breakdown by type */}
        <div className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">By Question Type</h2>
          <div className="space-y-2">
            {Object.entries(byType).map(([type, { total, count }]) => (
              <div
                key={type}
                className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900/50 px-4 py-3"
              >
                <span className="text-sm capitalize text-gray-300">
                  {type.replace(/_/g, " ")}
                </span>
                <span className="text-sm font-semibold text-gray-100">
                  {Math.round(total / count)} avg ({count})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* What you learned */}
        <div className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">What You Learned</h2>
          <div className="space-y-2">
            {answers.map((a, i) => (
              <div
                key={i}
                className={`rounded-lg border p-4 ${
                  a.score >= 70
                    ? "border-green-900/50 bg-green-950/20"
                    : "border-red-900/50 bg-red-950/20"
                }`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {a.episodeTitle}
                  </span>
                  <span
                    className={`text-xs font-semibold ${
                      a.score >= 70 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {a.score}/100
                  </span>
                </div>
                <p className="mb-1 text-sm text-gray-300">{a.questionText}</p>
                <p className="text-xs text-gray-500">{a.feedback}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => {
              setPhase("setup");
              setQuestions([]);
              setAnswers([]);
              setCurrentIndex(0);
            }}
            className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-indigo-500"
          >
            Play Again
          </button>
          <button
            onClick={() => router.push("/")}
            className="rounded-xl border border-gray-700 px-6 py-3 font-semibold text-gray-300 transition-colors hover:border-gray-500"
          >
            Pick Another Topic
          </button>
        </div>
      </main>
    );
  }

  return null;
}
