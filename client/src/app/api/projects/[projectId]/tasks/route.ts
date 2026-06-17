import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

type RouteParams = {
  params: Promise<{ projectId: string }>;
};

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { projectId } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { title } = await request.json();

  if (!title || !title.trim()) {
    return NextResponse.json(
      { error: "Task title is required" },
      { status: 400 }
    );
  }

  const { count, error: countError } = await supabase
    .from("project_tasks")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);

  if (countError) {
    console.error("project tasks: count failed", countError);
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }

  const { data: task, error: taskError } = await supabase
    .from("project_tasks")
    .insert({
      project_id: projectId,
      user_id: user.id,
      title: title.trim(),
      position: count ?? 0,
    })
    .select()
    .single();

  if (taskError) {
    console.error("project tasks: insert failed", taskError);
    return NextResponse.json({ error: taskError.message }, { status: 500 });
  }

  return NextResponse.json({ task });
}
