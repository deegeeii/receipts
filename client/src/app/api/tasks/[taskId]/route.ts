import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

type RouteParams = {
  params: Promise<{ taskId: string }>;
};

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { taskId } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { completed } = await request.json();

  const { data: task, error: taskError } = await supabase
  .from("project_tasks")
  .update({
    completed,
    completed_at: completed ? new Date().toISOString() : null,
  })
  .eq("id", taskId)
  .eq("user_id", user.id)
  .select()
  .single();


  if (taskError) {
    console.error("tasks: update failed", taskError);
    return NextResponse.json({ error: taskError.message }, { status: 500 });
  }

  return NextResponse.json({ task });
}
