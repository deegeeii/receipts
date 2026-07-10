// ── IMPORTS ───────────────────────────────────────────────────────────────────
import { createClient } from "@/lib/supabase/server";
import { getDateInTimezone } from "@/lib/date/getDateInTimezone";
import { NextResponse } from "next/server";

// ── HANDLER ───────────────────────────────────────────────────────────────────
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("timezone")
    .eq("id", user.id)
    .single();

  const today = getDateInTimezone(new Date(), profile?.timezone ?? "UTC");

  const { data: projects, error } = await supabase
    .from("projects")
    .select("id, title")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("deposit_amount", { ascending: false });

  if (error) {
    console.error("projects/active: fetch failed", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!projects || projects.length === 0) {
    return NextResponse.json({ projects: [] });
  }

  const projectIds = projects.map((p) => p.id);

  const { data: checkIns } = await supabase
    .from("check_ins")
    .select("project_id")
    .in("project_id", projectIds)
    .eq("check_in_date", today);

  const checkedInIds = new Set((checkIns ?? []).map((c) => c.project_id));

  return NextResponse.json({
    projects: projects.map((p) => ({
      id: p.id,
      title: p.title,
      checked_in_today: checkedInIds.has(p.id),
    })),
  });
}
