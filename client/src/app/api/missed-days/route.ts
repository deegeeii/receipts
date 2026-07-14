// ── IMPORTS ───────────────────────────────────────────────────────────────────
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// ── HANDLER ───────────────────────────────────────────────────────────────────
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("missed_days")
    .select("id, project_id, missed_date, projects(title)")
    .eq("user_id", user.id)
    .is("resolution", null)
    .order("missed_date", { ascending: true });

  if (error) {
    console.error("missed-days GET: fetch failed", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ missed_days: data ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { missed_day_id, resolution, charity } = await request.json();

  if (!missed_day_id || !resolution) {
    return NextResponse.json(
      { error: "Missing missed_day_id or resolution" },
      { status: 400 }
    );
  }

  if (resolution !== "rollover" && resolution !== "donated") {
    return NextResponse.json(
      { error: "resolution must be rollover or donated" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("missed_days")
    .update({
      resolution,
      ...(resolution === "donated" && charity ? { charity } : {}),
    })
    .eq("id", missed_day_id)
    .eq("user_id", user.id);

  if (error) {
    console.error("missed-days POST: update failed", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
