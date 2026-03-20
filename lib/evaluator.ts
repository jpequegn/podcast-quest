import { anthropic } from "./anthropic";

export interface EvaluationResult {
  score: number;
  feedback: string;
  correctAnswer: string;
}

interface QuestionInput {
  format: "multiple_choice" | "open";
  text: string;
  options?: string[] | null;
  correct_answer: string;
  model_answer?: string | null;
  scoring_rubric?: string | null;
}

/**
 * Fast path: MC questions — exact match on the letter (A/B/C/D).
 */
function evaluateMC(
  question: QuestionInput,
  playerAnswer: string,
): EvaluationResult {
  const normalized = playerAnswer.trim().toUpperCase().replace(/[^A-D]/g, "");
  const correct = question.correct_answer.trim().toUpperCase().replace(/[^A-D]/g, "");
  const isCorrect = normalized === correct;

  const correctOption = question.options?.find((o) =>
    o.trim().startsWith(correct + ")"),
  );

  return {
    score: isCorrect ? 100 : 0,
    feedback: isCorrect
      ? "Correct!"
      : `Incorrect. The right answer was ${correct}.`,
    correctAnswer: correctOption ?? question.correct_answer,
  };
}

/**
 * Slow path: open questions — use Claude Haiku for scoring.
 * Rubric dimensions: factual accuracy, completeness, insight.
 */
async function evaluateOpen(
  question: QuestionInput,
  playerAnswer: string,
): Promise<EvaluationResult> {
  const prompt = `You are a quiz answer evaluator. Score the player's answer against the model answer.

## Question
${question.text}

## Model Answer
${question.model_answer ?? question.correct_answer}

## Scoring Rubric
${question.scoring_rubric ?? "Evaluate on factual accuracy, completeness, and insight."}

## Player's Answer
${playerAnswer}

## Instructions
Score from 0-100 on three dimensions:
- **Factual accuracy** (0-40): Are the facts correct?
- **Completeness** (0-40): Does it cover the key points from the rubric?
- **Insight** (0-20): Does it show deeper understanding or add valuable perspective?

Respond in JSON only:
{
  "score": <0-100>,
  "feedback": "<one sentence of constructive feedback>"
}`;

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20241022",
    max_tokens: 256,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    // Fallback: give partial credit if we can't parse
    return {
      score: 50,
      feedback: "Your answer was recorded but could not be fully evaluated.",
      correctAnswer: question.model_answer ?? question.correct_answer,
    };
  }

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    score: Math.max(0, Math.min(100, parsed.score)),
    feedback: parsed.feedback,
    correctAnswer: question.model_answer ?? question.correct_answer,
  };
}

/**
 * Evaluate a player's answer. Routes to fast path (MC) or slow path (open).
 */
export async function evaluateAnswer(
  question: QuestionInput,
  playerAnswer: string,
): Promise<EvaluationResult> {
  if (!playerAnswer.trim()) {
    return {
      score: 0,
      feedback: "No answer provided.",
      correctAnswer: question.model_answer ?? question.correct_answer,
    };
  }

  if (question.format === "multiple_choice") {
    return evaluateMC(question, playerAnswer);
  }

  return evaluateOpen(question, playerAnswer);
}
