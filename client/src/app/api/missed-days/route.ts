// ── IMPORTS ───────────────────────────────────────────────────────────────────
import { supabaseAdmin } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

// ── HANDLER ───────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const secret = request.headers.get("authorization");

  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date().toISOString().slice(0, 10);

  const { data: activeProjects, error: projectsError } = await supabaseAdmin
    .from("projects")
    .select("id, user_id, work_days, start_date, missed_day_preference, default_charity")
    .eq("status", "active")
    .lte("start_date", today);

  if (projectsError) {
    console.error("cron/missed-days: projects fetch failed", projectsError);
    return NextResponse.json({ error: projectsError.message }, { status: 500 });
  }

  const projects = activeProjects ?? [];

  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);
  const yesterdayDow = yesterday.getUTCDay();

  const eligibleProjectIds = projects
    .filter((p) => Array.isArray(p.work_days) && p.work_days.includes(yesterdayDow))
    .map((p) => p.id);

  if (eligibleProjectIds.length === 0) {
    return NextResponse.json({ ok: true, missed: 0 });
  }

  const { data: checkIns } = await supabaseAdmin
    .from("check_ins")
    .select("project_id")
    .in("project_id", eligibleProjectIds)
    .eq("check_in_date", yesterdayStr);

  const checkedInIds = new Set((checkIns ?? []).map((c) => c.project_id));

  const missedProjects = projects.filter(
    (p) =>
      eligibleProjectIds.includes(p.id) &&
      !checkedInIds.has(p.id)
  );

  if (missedProjects.length === 0) {
    return NextResponse.json({ ok: true, missed: 0 });
  }

  const rows = missedProjects.map((p) => ({
    project_id: p.id,
    user_id: p.user_id,
    missed_date: yesterdayStr,
    ...(p.missed_day_preference
      ? {
          resolution: p.missed_day_preference,
          ...(p.missed_day_preference === "donated" && p.default_charity
            ? { charity: p.default_charity }
            : {}),
        }
      : {}),
  }));

  const { error: insertError } = await supabaseAdmin
    .from("missed_days")
    .insert(rows)
    .onConflict("project_id, missed_date")
    .ignore();

  if (insertError) {
    console.error("cron/missed-days: insert failed", insertError);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  console.log(`cron/missed-days: inserted ${missedProjects.length} missed days for ${yesterdayStr}`);

  return NextResponse.json({ ok: true, missed: missedProjects.length });
}
