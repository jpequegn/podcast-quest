import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const topic = searchParams.get("topic");
  const count = Math.min(parseInt(searchParams.get("count") ?? "5"), 20);

  if (!topic) {
    return NextResponse.json({ error: "topic is required" }, { status: 400 });
  }

  // Map landing-page slugs to corpus topics
  const TOPIC_MAPPING: Record<string, string[]> = {
    growth: ["growth", "startups"],
    product: ["product-management", "design"],
    leadership: ["leadership", "engineering-culture"],
    strategy: ["strategy", "fintech"],
    engineering: [
      "infrastructure",
      "cloud-native",
      "platform-engineering",
      "developer-tools",
      "data-engineering",
    ],
  };

  let query = supabase
    .from("questions")
    .select(
      "id, type, format, text, options, topic, episode_id, second_episode_id",
    );

  if (topic !== "random") {
    const corpusTopics = TOPIC_MAPPING[topic] ?? [topic];
    query = query.in("topic", corpusTopics);
  }

  const { data, error } = await query.limit(count * 3); // fetch extra to randomize

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Shuffle and take the requested count
  const shuffled = (data ?? []).sort(() => Math.random() - 0.5).slice(0, count);

  // Fetch episode titles for context
  const episodeIds = [
    ...new Set(
      shuffled
        .flatMap((q) => [q.episode_id, q.second_episode_id])
        .filter(Boolean),
    ),
  ];

  const { data: episodes } = await supabase
    .from("episodes")
    .select("id, title, podcast, key_topics, quotes, key_takeaways")
    .in("id", episodeIds);

  const episodeMap = new Map(
    (episodes ?? []).map((ep) => [ep.id, ep]),
  );

  const questions = shuffled.map((q) => ({
    ...q,
    episode: episodeMap.get(q.episode_id) ?? null,
    secondEpisode: q.second_episode_id
      ? episodeMap.get(q.second_episode_id) ?? null
      : null,
  }));

  return NextResponse.json({ questions });
}
