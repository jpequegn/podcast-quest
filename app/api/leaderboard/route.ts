import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const topic = searchParams.get("topic"); // null = overall

  let query = supabase
    .from("game_sessions")
    .select("id, player_name, topic, avg_score, question_count, completed_at")
    .not("player_name", "is", null)
    .order("avg_score", { ascending: false })
    .order("completed_at", { ascending: false })
    .limit(10);

  if (topic && topic !== "overall") {
    query = query.eq("topic", topic);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ entries: data ?? [] });
}
