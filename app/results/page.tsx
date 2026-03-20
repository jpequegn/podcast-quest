"use client";

import { useRouter } from "next/navigation";

export default function ResultsPage() {
  const router = useRouter();

  return (
    <main className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="mb-4 text-3xl font-bold">No Results Yet</h1>
      <p className="mb-8 text-gray-400">
        Complete a quiz to see your results here.
      </p>
      <button
        onClick={() => router.push("/")}
        className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-indigo-500"
      >
        Pick a Topic
      </button>
    </main>
  );
}
