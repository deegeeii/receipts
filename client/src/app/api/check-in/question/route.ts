import { createClient } from "@/lib/supabase/server";
import { anthropic } from "@/lib/anthropic/client";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { project_id, receipt_text } = await request.json();

  const { data: project } = await supabase
    .from("projects")
    .select("title, good_day_description, hard_day_description")
    .eq("id", project_id)
    .eq("user_id", user.id)
    .single();

  if (!project) {
    console.error("question: project not found", { project_id, user_id: user.id });
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const systemPrompt = `You are the voice of Receipt — an accountability app where people put money on the line to get real work done.

Someone just dropped their "receipt" — a short account of what they did today on their project. Your job is to ask ONE sharp, specific follow-up question about it.

Rules:
- Reference something concrete from what they wrote. A real decision, detail, or edge case they mentioned. Never ask something generic like "how did it go?" or "what did you learn?"
- One or two sentences, max.
- Sound like a sharp friend who's actually paying attention — not a corporate bot, not a checklist.
- Tone: warm and curious. This person is early in their journey with the app.
- Do not summarize what they said back to them first. Just ask the question.
- Respond with ONLY the question. No preamble, no labels.

Project: ${project.title}
What a good day looks like for them: ${project.good_day_description}
What a hard day looks like for them: ${project.hard_day_description}`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 200,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: receipt_text,
        },
      ],
    });

    const question =
      message.content[0].type === "text" ? message.content[0].text : "";

    return NextResponse.json({ question });
  } catch (aiError) {
    console.error("question: anthropic call failed", aiError);
    return NextResponse.json(
      { error: "AI question generation failed", details: String(aiError) },
      { status: 502 }
    );
  }
}
