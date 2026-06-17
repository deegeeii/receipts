import { createClient } from "@/lib/supabase/server";
import { anthropic } from "@/lib/anthropic/client";
import { NextRequest, NextResponse } from "next/server";
import { formatTaskList } from "@/lib/ai/formatTaskList";

// POST /api/check-in/question — generate an AI follow-up question for the daily receipt or weekly review
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

  const { data: project } = await supabase
    .from("projects")
    .select("title, good_day_description, hard_day_description")
    .eq("id", project_id)
    .eq("user_id", user.id)
    .single();

  if (!project) {
    console.error("question: project not found", {
      project_id,
      user_id: user.id,
    });
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

  let systemPrompt: string;

  const isReviewMode = mode === "weekly_review" || mode === "pending_review";

  if (isReviewMode) {
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
    - Sound like a sharp mentor who's seen the whole picture — not just today's entry.
    - Tone: direct, perceptive. No fluff, no praise for the sake of praise.
    - Do not summarize the week back to them. Just ask the question.
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
    - Sound like a sharp friend who's actually paying attention — not a corporate bot, not a checklist.
    - Tone: warm and curious. This person is early in their journey with the app.
    - Do not summarize what they said back to them first. Just ask the question.
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
