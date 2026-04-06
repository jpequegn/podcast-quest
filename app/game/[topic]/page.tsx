import GameClient from "./game-client";

interface GamePageProps {
  params: Promise<{ topic: string }>;
}

export default async function GamePage({ params }: GamePageProps) {
  const { topic } = await params;

  return <GameClient topic={topic} />;
}
