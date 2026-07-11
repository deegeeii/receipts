// ── IMPORTS ───────────────────────────────────────────────────────────────────
import { createClient } from "@/lib/supabase/server";
import { anthropic } from "@/lib/anthropic/client";
import { NextRequest, NextResponse } from "next/server";
import { formatTaskList } from "@/lib/ai/formatTaskList";
import { getVoiceTone } from "@/lib/ai/getVoiceTone";

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const MYSTERY_FORMATS = [
  "timed_write",
  "ai_quiz",
  "one_word_expand",
  "gut_check",
  "draw_a_scene",
] as const;

type MysteryFormat = (typeof MYSTERY_FORMATS)[number];

const MYSTERY_PROMPTS: Record<Exclude<MysteryFormat, "ai_quiz">, string> = {
  timed_write:
    "Write for 2 minutes without stopping. Don't edit. Don't backspace. Just go.",
  one_word_expand: "Pick one word that defines today.",
  gut_check: "Rate today 1–10. Then explain your score.",
  draw_a_scene:
    "Describe the exact scene where you did your best work today. The chair, the light, the sounds.",
};

// ── HANDLER ───────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { project_id, receipt_text, mode = "receipt" } =
    await request.json();

  const { data: profile } = await supabase
    .from("users")
    .select("ai_voice")
    .eq("id", user.id)
    .single();

  const toneLine = getVoiceTone(profile?.ai_voice ?? "warm");

  // light_day skips the question stage entirely
  if (mode === "light_day") {
    return NextResponse.json({ skip: true, question: "", question2: "" });
  }

  // mystery_door — pick a random format, generate quiz if needed
  if (mode === "mystery_door") {
    const format =
      MYSTERY_FORMATS[Math.floor(Math.random() * MYSTERY_FORMATS.length)];

    if (format !== "ai_quiz") {
      return NextResponse.json({
        format,
        prompt: MYSTERY_PROMPTS[format as Exclude<MysteryFormat, "ai_quiz">],
      });
    }

    const { data: project } = await supabase
      .from("projects")
      .select("title, good_day_description, hard_day_description")
      .eq("id", project_id)
      .eq("user_id", user.id)
      .single();

    if (!project) {
      console.error("question: mystery_door project not found", { project_id });
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const { data: recentCheckIns } = await supabase
      .from("check_ins")
      .select("check_in_date, receipt_text")
      .eq("project_id", project_id)
      .eq("user_id", user.id)
      .order("check_in_date", { ascending: false })
      .limit(3);

    const recentContext =
      recentCheckIns && recentCheckIns.length > 0
        ? recentCheckIns
            .map((c) => `${c.check_in_date}: ${c.receipt_text}`)
            .join("\n")
        : "No prior check-ins.";

    try {
      const message = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        system: `You are the voice of Receipt — an accountability app where people put money on the line to get real work done. Generate exactly 3 sharp, specific check-in questions for this project.

Rules:
- Questions must be specific to this project — not generic.
- Mix the angles: one about today's specifics, one about obstacles or decisions, one about momentum going forward.
- One sentence each, max.
- ${toneLine}
- Respond with EXACTLY 3 questions, one per line. No numbering, no labels, no extra text.

Project: ${project.title}
What a good day looks like: ${project.good_day_description}
What a hard day looks like: ${project.hard_day_description}

Recent check-ins:
${recentContext}`,
        messages: [{ role: "user", content: "Generate the quiz." }],
      });

      const rawText =
        message.content[0].type === "text" ? message.content[0].text : "";

      const questions = rawText
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0)
        .slice(0, 3);

      return NextResponse.json({
        format: "ai_quiz",
        prompt: "Answer all three.",
        questions,
      });
    } catch (aiError) {
      console.error("question: ai_quiz generation failed", aiError);
      return NextResponse.json({
        format: "gut_check",
        prompt: MYSTERY_PROMPTS.gut_check,
      });
    }
  }

  // Standard modes
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

  const { data: tasks } = await supabase
    .from("project_tasks")
    .select("title, completed, completed_at")
    .eq("project_id", project_id)
    .order("position", { ascending: true });

  const { roadmap, completedToday } = formatTaskList(tasks ?? []);

  const completedTodayLine =
    completedToday.length > 0
      ? `They checked off these roadmap steps today: ${completedToday.join(", ")}.`
      : "";

  const isReviewMode = mode === "weekly_review" || mode === "pending_review";

  let systemPrompt: string;

  if (mode === "heavy_day") {
    systemPrompt = `You are the voice of Receipt — an accountability app where people put money on the line to get real work done.

    Today is this person's Peak Day — their most important work day of the week. They just dropped their receipt. Ask TWO sharp, specific follow-up questions.

    Rules:
    - Question 1: Dig into the specifics of what they did. Reference a real decision, detail, or challenge from their receipt.
    - Question 2: Zoom out — strategy, the bigger picture, or what they'll carry into the rest of the week.
    - Each question is one or two sentences max.
    - Both questions must be specific to what they wrote. No generic questions.
    - ${toneLine}
    - Respond with EXACTLY 2 questions, each on its own line. No numbering, no labels, no extra text.

    Project: ${project.title}
    What a good day looks like: ${project.good_day_description}
    What a hard day looks like: ${project.hard_day_description}

    Project roadmap:
    ${roadmap}
    ${completedTodayLine}`;

  } else if (isReviewMode) {
    const { data: recentCheckIns, error: checkInsError } = await supabase
      .from("check_ins")
      .select("check_in_date, receipt_text, ai_question, ai_response")
      .eq("project_id", project_id)
      .eq("user_id", user.id)
      .order("check_in_date", { ascending: false })
      .limit(5);

    if (checkInsError) {
      console.error("question: weekly check-ins fetch failed", checkInsError);
    }

    const weekHistory =
      recentCheckIns && recentCheckIns.length > 0
        ? recentCheckIns
            .map(
              (c) =>
                `${c.check_in_date}:\n  Receipt: ${c.receipt_text}\n  Question: ${c.ai_question}\n  Answer: ${c.ai_response}`
            )
            .join("\n\n")
        : "No prior check-ins this week.";

    systemPrompt = `You are the voice of Receipt — an accountability app where people put money on the line to get real work done.

    Today is Weekly Review day. Someone just wrote their week-in-review receipt. You also have the last 5 days of their check-ins for full context.

    Your job is to ask ONE deep, specific reflection question about their week.

    Rules:
    - Look across the entire week — find a theme, a pattern, a tension, or a breakthrough they may not have named themselves.
    - Ask about something that matters for the NEXT week, not just what already happened.
    - One or two sentences, max.
    - Do not summarize the week back to them. Just ask the question.
    - ${toneLine}
    - Respond with ONLY the question. No preamble, no labels.

    Project: ${project.title}
    What a good day looks like for them: ${project.good_day_description}
    What a hard day looks like for them: ${project.hard_day_description}

    Project roadmap:
    ${roadmap}

    Past 5 days of check-ins:
    ${weekHistory}`;

  } else {
    systemPrompt = `You are the voice of Receipt — an accountability app where people put money on the line to get real work done.

    Someone just dropped their "receipt" — a short account of what they did today on their project. Your job is to ask ONE sharp, specific follow-up question about it.

    Rules:
    - Reference something concrete from what they wrote. A real decision, detail, or edge case they mentioned. Never ask something generic like "how did it go?" or "what did you learn?"
    - If they checked off roadmap steps today, you can ask about one of those specifically instead.
    - One or two sentences, max.
    - Do not summarize what they said back to them first. Just ask the question.
    - ${toneLine}
    - Respond with ONLY the question. No preamble, no labels.

    Project: ${project.title}
    What a good day looks like for them: ${project.good_day_description}
    What a hard day looks like for them: ${project.hard_day_description}

    Project roadmap:
    ${roadmap}
    ${completedTodayLine}`;
  }

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 300,
      system: systemPrompt,
      messages: [{ role: "user", content: receipt_text }],
    });

    const rawText =
      message.content[0].type === "text" ? message.content[0].text : "";

    if (mode === "heavy_day") {
      const lines = rawText
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
      const question = lines[0] ?? "";
      const question2 = lines[1] ?? "";
      return NextResponse.json({ question, question2 });
    }

    return NextResponse.json({ question: rawText });
  } catch (aiError) {
    console.error("question: anthropic call failed", aiError);
    return NextResponse.json(
      { error: "AI question generation failed", details: String(aiError) },
      { status: 502 }
    );
  }
}
