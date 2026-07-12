// ── IMPORTS ───────────────────────────────────────────────────────────────────
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

// ── HANDLER ───────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const adminIds = (process.env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (!adminIds.includes(user.id)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { active } = await request.json();

  if (typeof active !== "boolean") {
    return NextResponse.json(
      { error: "active must be a boolean" },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin
    .from("app_events")
    .update({
      active,
      ...(active
        ? { started_at: new Date().toISOString(), ended_at: null }
        : { ended_at: new Date().toISOString() }),
    })
    .eq("event_type", "receipt_day");

  if (error) {
    console.error("admin: receipt day toggle failed", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ active });
}
