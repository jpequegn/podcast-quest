/**
 * Generate questions from episodes using Claude and insert into Supabase.
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... ANTHROPIC_API_KEY=... \
 *     bun run scripts/generate-questions.ts [--limit N] [--types type1,type2]
 *
 * Generates ~5 questions per episode (one per type) for top episodes per topic.
 * With 20 topics x ~10 episodes = ~200 episodes x 1-2 MC types = 100+ questions minimum.
 */

import { createClient } from "@supabase/supabase-js";
import {
  generateQuestion,
  type QuestionType,
  type GeneratedQuestion,
} from "../lib/generator";
import type { Episode } from "../lib/corpus";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey || !process.env.ANTHROPIC_API_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or ANTHROPIC_API_KEY",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// Parse CLI args
const args = process.argv.slice(2);
const limitIdx = args.indexOf("--limit");
const episodeLimit = limitIdx !== -1 ? parseInt(args[limitIdx + 1]) : 50;
const typesIdx = args.indexOf("--types");
const requestedTypes: QuestionType[] = typesIdx !== -1
  ? (args[typesIdx + 1].split(",") as QuestionType[])
  : ["factual_recall", "speaker_attribution"];

// For open question types, we process fewer episodes (they're more expensive)
const OPEN_TYPES: QuestionType[] = [
  "trend_identification",
  "prediction",
  "connect_the_dots",
];

async function fetchEpisodes(limit: number): Promise<Episode[]> {
  const { data, error } = await supabase
    .from("episodes")
    .select("*")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to fetch episodes:", error.message);
    process.exit(1);
  }
  return data ?? [];
}

async function insertQuestion(q: GeneratedQuestion) {
  const { error } = await supabase.from("questions").insert({
    episode_id: q.episode_id,
    second_episode_id: q.second_episode_id,
    type: q.type,
    format: q.format,
    text: q.text,
    options: q.options,
    correct_answer: q.correct_answer,
    model_answer: q.model_answer,
    scoring_rubric: q.scoring_rubric,
    topic: q.topic,
    source_quote: q.source_quote,
  });

  if (error) {
    console.error(`  Failed to insert question: ${error.message}`);
    return false;
  }
  return true;
}

async function main() {
  console.log(
    `Generating questions (limit=${episodeLimit}, types=${requestedTypes.join(",")})`,
  );

  const episodes = await fetchEpisodes(episodeLimit);
  console.log(`Fetched ${episodes.length} episodes\n`);

  let generated = 0;
  let failed = 0;

  for (let i = 0; i < episodes.length; i++) {
    const episode = episodes[i];
    console.log(
      `[${i + 1}/${episodes.length}] "${episode.title}" (${episode.key_topics[0]})`,
    );

    for (const type of requestedTypes) {
      // For connect_the_dots, pick a random second episode
      let secondEpisode: Episode | undefined;
      if (type === "connect_the_dots") {
        const others = episodes.filter((e) => e.id !== episode.id);
        secondEpisode = others[Math.floor(Math.random() * others.length)];
      }

      try {
        const question = await generateQuestion(
          episode,
          type,
          secondEpisode,
        );

        // Quality gate: reject if source_quote is missing
        if (!question.source_quote) {
          console.log(`  SKIP ${type}: no source quote (not traceable)`);
          failed++;
          continue;
        }

        const ok = await insertQuestion(question);
        if (ok) {
          generated++;
          console.log(`  OK ${type}: "${question.text.slice(0, 60)}..."`);
        } else {
          failed++;
        }
      } catch (err) {
        console.error(
          `  FAIL ${type}: ${err instanceof Error ? err.message : err}`,
        );
        failed++;
      }

      // Rate limiting: small delay between API calls
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  console.log(`\nDone! Generated: ${generated}, Failed: ${failed}`);

  // Print distribution
  const { data: counts } = await supabase
    .from("questions")
    .select("type, topic");

  if (counts) {
    const byType: Record<string, number> = {};
    const byTopic: Record<string, number> = {};
    for (const row of counts) {
      byType[row.type] = (byType[row.type] || 0) + 1;
      byTopic[row.topic] = (byTopic[row.topic] || 0) + 1;
    }

    console.log("\nBy type:");
    for (const [t, c] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${t}: ${c}`);
    }
    console.log("\nBy topic (top 10):");
    for (const [t, c] of Object.entries(byTopic)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)) {
      console.log(`  ${t}: ${c}`);
    }
  }
}

main();
