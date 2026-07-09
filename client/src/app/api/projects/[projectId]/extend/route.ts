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

  const { new_end_date } = await request.json();

  if (!new_end_date) {
    return NextResponse.json(
      { error: "Missing new_end_date" },
      { status: 400 }
    );
  }

  const { data: project } = await supabase
    .from("projects")
    .select("id, end_date, status")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (project.status !== "active") {
    return NextResponse.json(
      { error: "Project is not active" },
      { status: 400 }
    );
  }

  if (new_end_date <= project.end_date) {
    return NextResponse.json(
      { error: "New end date must be after current end date" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("projects")
    .update({ end_date: new_end_date })
    .eq("id", projectId);

  if (error) {
    console.error("extend: update failed", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, new_end_date });
}
