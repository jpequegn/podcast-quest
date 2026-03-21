import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { topic, questionCount, avgScore, totalScore, answers, startedAt } =
    body;

  if (!topic || !answers) {
    return NextResponse.json(
      { error: "topic and answers are required" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("game_sessions")
    .insert({
      topic,
      question_count: questionCount,
      avg_score: avgScore,
      total_score: totalScore,
      answers,
      started_at: startedAt,
      completed_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);

  const { data, error } = await supabase
    .from("game_sessions")
    .select("*")
    .order("completed_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ sessions: data ?? [] });
}
