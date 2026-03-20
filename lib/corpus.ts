/**
 * P3 data loader — loads podcast corpus from DuckDB export.
 */

export interface Episode {
  id: string;
  title: string;
  summary: string;
  topics: string[];
}

export async function loadCorpus(): Promise<Episode[]> {
  // TODO: Load from P3 DuckDB export
  return [];
}

export async function getEpisodesByTopic(topic: string): Promise<Episode[]> {
  const corpus = await loadCorpus();
  if (topic === "random") return corpus;
  return corpus.filter((ep) => ep.topics.includes(topic));
}
