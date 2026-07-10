// ── IMPORTS ───────────────────────────────────────────────────────────────────
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// ── TYPES ─────────────────────────────────────────────────────────────────────
type RouteParams = {
  params: Promise<{ projectId: string }>;
};

// ── HANDLER ───────────────────────────────────────────────────────────────────
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { projectId } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { missed_day_preference, default_charity } = await request.json();

  const update: Record<string, string | null> = {
    missed_day_preference: missed_day_preference ?? null,
  };

  if (missed_day_preference === "donated") {
    update.default_charity = default_charity ?? null;
  } else {
    update.default_charity = null;
  }

  const { error } = await supabase
    .from("projects")
    .update(update)
    .eq("id", projectId)
    .eq("user_id", user.id);

  if (error) {
    console.error("preference: update failed", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
