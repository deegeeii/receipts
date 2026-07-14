// ── IMPORTS ───────────────────────────────────────────────────────────────────
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { anthropic } from "@/lib/anthropic/client";
import { NextRequest, NextResponse } from "next/server";

// ── HANDLER ───────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
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

  const { project_id, entry_text } = await request.json();

  if (!entry_text || !entry_text.trim()) {
    return NextResponse.json(
      { error: "Journal entry text is required" },
      { status: 400 }
    );
  }

  const { data: project, error: projectError } = await db
    .from("projects")
    .select("title, good_day_description, hard_day_description")
    .eq("id", project_id)
    .eq("user_id", user.id)
    .single();

  if (projectError || !project) {
    console.error("journal: project not found", projectError);
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const systemPrompt = `You are the voice of Receipt — an accountability app where people put money on the line to get real work done.

Someone just wrote a journal entry reflecting on a tough or exceptional week with this project. Your job is to give a short, grounded reinforcement response.

Rules:
- Reference something specific from what they wrote.
- Two to four sentences.
- Tone: warm, direct, like a friend who believes quitting is the only real failure — not a corporate coach.
- Do not be dismissive of struggle, but don't wallow either. Acknowledge, then point forward.
- Respond with ONLY the reinforcement message. No preamble, no labels.

Project: ${project.title}
What a good day looks like for them: ${project.good_day_description}
What a hard day looks like for them: ${project.hard_day_description}

Their journal entry: ${entry_text}`;

  let aiResponse = "";

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 300,
      system: systemPrompt,
      messages: [{ role: "user", content: entry_text }],
    });

    aiResponse =
      message.content[0].type === "text" ? message.content[0].text : "";
  } catch (aiError) {
    console.error("journal: anthropic call failed", aiError);
    return NextResponse.json(
      { error: "AI reinforcement failed", details: String(aiError) },
      { status: 502 }
    );
  }

  const { data: entry, error: entryError } = await db
    .from("journal_entries")
    .insert({
      user_id: user.id,
      project_id,
      entry_text,
      ai_response: aiResponse,
    })
    .select()
    .single();

  if (entryError) {
    console.error("journal: insert failed", entryError);
    return NextResponse.json({ error: entryError.message }, { status: 500 });
  }

  return NextResponse.json({ entry });
}
