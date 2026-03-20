/**
 * Answer scoring using Anthropic SDK.
 */

export interface EvaluationResult {
  score: number;
  feedback: string;
  correctAnswer: string;
}

export async function evaluateAnswer(
  _question: string,
  _userAnswer: string,
  _context: string,
): Promise<EvaluationResult> {
  // TODO: Use Anthropic SDK to evaluate user's answer
  return {
    score: 0,
    feedback: "",
    correctAnswer: "",
  };
}
