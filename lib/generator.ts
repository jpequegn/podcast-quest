import { anthropic } from "./anthropic";
import type { Episode } from "./corpus";

export type QuestionType =
  | "factual_recall"
  | "speaker_attribution"
  | "trend_identification"
  | "prediction"
  | "connect_the_dots";

export type QuestionFormat = "multiple_choice" | "open";

export interface GeneratedQuestion {
  type: QuestionType;
  format: QuestionFormat;
  text: string;
  options: string[] | null;
  correct_answer: string;
  model_answer: string | null;
  scoring_rubric: string | null;
  topic: string;
  source_quote: string | null;
  episode_id: string;
  second_episode_id: string | null;
}

const QUESTION_TYPE_CONFIG: Record<
  QuestionType,
  { format: QuestionFormat; description: string }
> = {
  factual_recall: {
    format: "multiple_choice",
    description:
      "A factual recall question about a specific detail from the episode. Include 4 options (A-D) with exactly one correct answer.",
  },
  speaker_attribution: {
    format: "multiple_choice",
    description:
      "A question asking which podcast or episode is associated with a specific insight or quote. Include 4 options (A-D) with exactly one correct answer.",
  },
  trend_identification: {
    format: "open",
    description:
      "An open-ended question asking the player to identify a recurring theme or trend across episodes.",
  },
  prediction: {
    format: "open",
    description:
      "An open-ended question asking the player to make a prediction based on the episode content.",
  },
  connect_the_dots: {
    format: "open",
    description:
      "An open-ended question asking what two episodes have in common or how their ideas relate.",
  },
};

function buildPrompt(
  type: QuestionType,
  episode: Episode,
  secondEpisode?: Episode,
): string {
  const config = QUESTION_TYPE_CONFIG[type];
  const episodeContext = formatEpisode(episode);

  let context = `## Episode\n${episodeContext}`;
  if (secondEpisode && type === "connect_the_dots") {
    context += `\n\n## Second Episode\n${formatEpisode(secondEpisode)}`;
  }

  const formatInstructions =
    config.format === "multiple_choice"
      ? `Respond in JSON:
{
  "text": "the question text",
  "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
  "correct_answer": "A",
  "source_quote": "the part of the episode that supports the answer"
}`
      : `Respond in JSON:
{
  "text": "the question text",
  "model_answer": "an ideal answer in 2-3 sentences",
  "scoring_rubric": "key points the answer should cover, as a comma-separated list",
  "source_quote": "the part of the episode that supports the answer"
}`;

  return `You are a quiz question writer for a podcast knowledge game.

${context}

## Task
${config.description}

The question MUST be answerable from the episode content provided. Do not ask about information not present in the summaries, quotes, or takeaways.

${formatInstructions}

Return ONLY the JSON object, no other text.`;
}

function formatEpisode(ep: Episode): string {
  return `Title: ${ep.title}
Podcast: ${ep.podcast}
Topics: ${ep.key_topics.join(", ")}
Quotes: ${ep.quotes.map((q) => `"${q}"`).join("; ")}
Key Takeaways: ${ep.key_takeaways.join("; ")}
Summary: ${ep.full_summary}`;
}

export async function generateQuestion(
  episode: Episode,
  type: QuestionType,
  secondEpisode?: Episode,
): Promise<GeneratedQuestion> {
  const config = QUESTION_TYPE_CONFIG[type];
  const prompt = buildPrompt(type, episode, secondEpisode);

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6-20250514",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`Failed to parse question JSON from response: ${text}`);
  }

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    type,
    format: config.format,
    text: parsed.text,
    options: parsed.options ?? null,
    correct_answer:
      config.format === "multiple_choice"
        ? parsed.correct_answer
        : parsed.model_answer,
    model_answer: parsed.model_answer ?? null,
    scoring_rubric: parsed.scoring_rubric ?? null,
    topic: episode.key_topics[0],
    source_quote: parsed.source_quote ?? null,
    episode_id: episode.id,
    second_episode_id: secondEpisode?.id ?? null,
  };
}

export async function generateQuestionsForEpisode(
  episode: Episode,
  types: QuestionType[] = ["factual_recall", "speaker_attribution"],
  secondEpisode?: Episode,
): Promise<GeneratedQuestion[]> {
  const questions: GeneratedQuestion[] = [];

  for (const type of types) {
    const q = await generateQuestion(episode, type, secondEpisode);
    questions.push(q);
  }

  return questions;
}
