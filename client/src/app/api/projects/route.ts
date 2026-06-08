import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();

  const {
    title,
    description,
    deposit_amount,
    daily_payout,
    start_date,
    end_date,
    work_style,
    obstacle_patterns,
    good_day_description,
    hard_day_description,
  } = body;

  const { data: profile } = await supabase
    .from("users")
    .select("work_style")
    .eq("id", user.id)
    .single();

  if (profile && !profile.work_style) {
    const { error: profileError } = await supabase
      .from("users")
      .update({ work_style, obstacle_patterns })
      .eq("id", user.id);

    if (profileError) {
      console.error("projects: users update failed", profileError);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      title,
      description,
      deposit_amount,
      daily_payout,
      start_date,
      end_date,
      good_day_description,
      hard_day_description,
    })
    .select()
    .single();

  if (projectError) {
    console.error("projects: insert failed", projectError);
    return NextResponse.json({ error: projectError.message }, { status: 500 });
  }

  return NextResponse.json({ project });
}
