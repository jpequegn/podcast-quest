import { supabase } from "./supabase";

export interface Episode {
  id: string;
  title: string;
  podcast: string;
  published_at: string;
  key_topics: string[];
  quotes: string[];
  key_takeaways: string[];
  full_summary: string;
}

// Map landing-page topic slugs to corpus key_topics
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
  random: [], // handled separately
};

export async function getEpisodesByTopic(
  topic: string,
  limit = 10,
): Promise<Episode[]> {
  if (topic === "random") {
    const { data, error } = await supabase
      .from("episodes")
      .select("*")
      .order("published_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);
    return data ?? [];
  }

  const corpusTopics = TOPIC_MAPPING[topic] ?? [topic];

  const { data, error } = await supabase
    .from("episodes")
    .select("*")
    .overlaps("key_topics", corpusTopics)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getTopTopics(
  limit = 20,
): Promise<{ topic: string; count: number }[]> {
  const { data, error } = await supabase
    .from("episodes")
    .select("key_topics");

  if (error) throw new Error(error.message);

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    for (const t of row.key_topics) {
      counts[t] = (counts[t] || 0) + 1;
    }
  }

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([topic, count]) => ({ topic, count }));
}
