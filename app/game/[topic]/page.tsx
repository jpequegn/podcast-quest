interface GamePageProps {
  params: Promise<{ topic: string }>;
}

export default async function GamePage({ params }: GamePageProps) {
  const { topic } = await params;

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="mb-4 text-3xl font-bold capitalize">{topic} Quiz</h1>
      <p className="text-gray-400">
        Quiz session for <span className="font-semibold text-white">{topic}</span> coming soon.
      </p>
    </main>
  );
}
