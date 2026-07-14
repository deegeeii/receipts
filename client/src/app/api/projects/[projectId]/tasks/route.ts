import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

type RouteParams = {
  params: Promise<{ projectId: string }>;
};

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { projectId } = await params;

  const supabase = await createClient();

  let {
    data: { user },
  } = await supabase.auth.getUser();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let db: any = supabase;

  if (!user) {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (token) {
      const { data } = await supabaseAdmin.auth.getUser(token);
      user = data.user ?? null;
      if (user) db = supabaseAdmin;
    }
  }

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

  const { count, error: countError } = await db
    .from("project_tasks")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);

  if (countError) {
    console.error("project tasks: count failed", countError);
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }

  const { data: task, error: taskError } = await db
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
