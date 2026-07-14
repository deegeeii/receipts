// ── IMPORTS ───────────────────────────────────────────────────────────────────
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { anthropic } from "@/lib/anthropic/client";
import { formatTaskList } from "@/lib/ai/formatTaskList";
import { NextRequest, NextResponse } from "next/server";

// ── TYPES ─────────────────────────────────────────────────────────────────────
type RouteParams = {
  params: Promise<{ projectId: string }>;
};

// ── HANDLER ───────────────────────────────────────────────────────────────────
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

  const { data: project, error: projectError } = await db
    .from("projects")
    .select("title, description, good_day_description, hard_day_description")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (projectError || !project) {
    console.error("tasks/generate: project not found", projectError);
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const { data: tasks, error: tasksError } = await db
    .from("project_tasks")
    .select("title, completed, completed_at")
    .eq("project_id", projectId)
    .order("position", { ascending: true });

  if (tasksError) {
    console.error("tasks/generate: tasks fetch failed", tasksError);
    return NextResponse.json({ error: tasksError.message }, { status: 500 });
  }

  const { roadmap } = formatTaskList(tasks ?? []);

  const systemPrompt = `You are helping someone break down their project into concrete roadmap steps for Receipt, an accountability app.

Rules:
- Suggest 3-5 NEW roadmap steps that are not already covered by their existing roadmap.
- Each step should be short, concrete, and actionable — something they could check off in a single sitting.
- Do not repeat or rephrase existing steps.
- Respond with ONLY a JSON array of strings, nothing else. Example: ["Step one", "Step two"]

Project: ${project.title}
Description: ${project.description}
What a good day looks like: ${project.good_day_description}
What a hard day looks like: ${project.hard_day_description}

Existing roadmap:
${roadmap}`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 300,
      system: systemPrompt,
      messages: [{ role: "user", content: "Suggest new roadmap steps." }],
    });

    const raw =
      message.content[0].type === "text" ? message.content[0].text : "[]";

    let suggestions: string[] = [];

    try {
      suggestions = JSON.parse(raw);
    } catch (parseError) {
      console.error("tasks/generate: failed to parse AI response", parseError, raw);
      return NextResponse.json(
        { error: "AI response was not valid JSON", details: raw },
        { status: 502 }
      );
    }

    return NextResponse.json({ suggestions });
  } catch (aiError) {
    console.error("tasks/generate: anthropic call failed", aiError);
    return NextResponse.json(
      { error: "AI task generation failed", details: String(aiError) },
      { status: 502 }
    );
  }
}
