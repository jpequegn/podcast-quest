import Link from "next/link";

const topics = [
  {
    slug: "growth",
    title: "Growth & Acquisition",
    description: "User growth, viral loops, and go-to-market strategies",
    icon: "📈",
  },
  {
    slug: "product",
    title: "Product Management",
    description: "Building great products, prioritization, and roadmaps",
    icon: "🎯",
  },
  {
    slug: "leadership",
    title: "Leadership & Culture",
    description: "Team building, hiring, and org design",
    icon: "🏛️",
  },
  {
    slug: "strategy",
    title: "Strategy & Business",
    description: "Business models, competition, and market dynamics",
    icon: "♟️",
  },
  {
    slug: "engineering",
    title: "Engineering & Tech",
    description: "Technical decisions, architecture, and dev culture",
    icon: "⚙️",
  },
  {
    slug: "random",
    title: "Random Mix",
    description: "A surprise mix of questions across all topics",
    icon: "🎲",
  },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <header className="mb-12 text-center">
        <h1 className="mb-3 text-5xl font-bold tracking-tight">
          Podcast Quest
        </h1>
        <p className="text-lg text-gray-400">
          Test your knowledge from the P3 podcast corpus. Pick a topic and start
          the quiz.
        </p>
        <Link
          href="/stats"
          className="mt-4 inline-block text-sm text-indigo-400 hover:text-indigo-300"
        >
          View your stats &rarr;
        </Link>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {topics.map((topic) => (
          <Link
            key={topic.slug}
            href={`/game/${topic.slug}`}
            className="group rounded-xl border border-gray-800 bg-gray-900 p-6 transition-colors hover:border-indigo-500 hover:bg-gray-800"
          >
            <div className="mb-2 text-3xl">{topic.icon}</div>
            <h2 className="mb-1 text-lg font-semibold group-hover:text-indigo-400">
              {topic.title}
            </h2>
            <p className="text-sm text-gray-500">{topic.description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
