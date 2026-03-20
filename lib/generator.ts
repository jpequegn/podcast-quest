/**
 * Question generation from podcast summaries using Anthropic SDK.
 */

export interface Question {
  id: string;
  text: string;
  topic: string;
  sourceEpisode: string;
}

export async function generateQuestions(
  _topic: string,
  _count: number = 5,
): Promise<Question[]> {
  // TODO: Use Anthropic SDK to generate questions from corpus summaries
  return [];
}
