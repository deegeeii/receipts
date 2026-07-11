// ── IMPORTS ───────────────────────────────────────────────────────────────────
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { getDateInTimezone } from "@/lib/date/getDateInTimezone";

// ── HANDLER ───────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { project_id } = await request.json();

  if (!project_id) {
    return NextResponse.json({ error: "project_id required" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("freeze_days_available, current_streak, timezone")
    .eq("id", user.id)
    .single();

  if (!profile) {
    console.error("freeze: profile not found", { user_id: user.id });
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  if ((profile.freeze_days_available ?? 0) < 1) {
    return NextResponse.json(
      { error: "No freeze days available" },
      { status: 400 }
    );
  }

  const { data: project } = await supabase
    .from("projects")
    .select("work_days")
    .eq("id", project_id)
    .eq("user_id", user.id)
    .single();

  if (!project) {
    console.error("freeze: project not found", { project_id });
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const today = getDateInTimezone(new Date(), profile.timezone);
  const todayDow = new Date(`${today}T00:00:00Z`).getUTCDay();
  const workDays: number[] = project.work_days ?? [1, 2, 3, 4, 5];

  if (!workDays.includes(todayDow)) {
    return NextResponse.json(
      { error: "Today is not a work day for this project" },
      { status: 400 }
    );
  }

  // Guard: don't freeze if already checked in today
  const { data: existingCheckIn } = await supabase
    .from("check_ins")
    .select("id")
    .eq("project_id", project_id)
    .eq("user_id", user.id)
    .eq("check_in_date", today)
    .single();

  if (existingCheckIn) {
    return NextResponse.json(
      { error: "Already checked in today" },
      { status: 400 }
    );
  }

  // Insert freeze record so the cron skips this project today
  const { error: checkInError } = await supabase
    .from("check_ins")
    .insert({
      project_id,
      user_id: user.id,
      receipt_text: "FREEZE",
      ai_question: null,
      ai_response: null,
      verified: false,
      xp_earned: 0,
      check_in_date: today,
    });

  if (checkInError) {
    console.error("freeze: check_in insert failed", checkInError);
    return NextResponse.json({ error: checkInError.message }, { status: 500 });
  }

  // Deduct token + protect streak by advancing last_check_in_date
  const { error: profileError } = await supabase
    .from("users")
    .update({
      freeze_days_available: profile.freeze_days_available - 1,
      last_check_in_date: today,
    })
    .eq("id", user.id);

  if (profileError) {
    console.error("freeze: profile update failed", profileError);
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    streak_protected: true,
    freeze_days_remaining: profile.freeze_days_available - 1,
  });
}
