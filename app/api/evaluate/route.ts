import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { evaluateAnswer } from "@/lib/evaluator";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { questionId, playerAnswer } = body;

  if (!questionId || playerAnswer === undefined) {
    return NextResponse.json(
      { error: "questionId and playerAnswer are required" },
      { status: 400 },
    );
  }

  // Fetch the full question with answer data
  const { data: question, error } = await supabase
    .from("questions")
    .select("*")
    .eq("id", questionId)
    .single();

  if (error || !question) {
    return NextResponse.json(
      { error: "Question not found" },
      { status: 404 },
    );
  }

  const result = await evaluateAnswer(
    {
      format: question.format,
      text: question.text,
      options: question.options,
      correct_answer: question.correct_answer,
      model_answer: question.model_answer,
      scoring_rubric: question.scoring_rubric,
    },
    playerAnswer,
  );

  return NextResponse.json({
    score: result.score,
    feedback: result.feedback,
    correctAnswer: result.correctAnswer,
    sourceQuote: question.source_quote,
  });
}
