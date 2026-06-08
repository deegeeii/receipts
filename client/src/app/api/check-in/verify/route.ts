import { createClient } from "@/lib/supabase/server";
import { anthropic } from "@/lib/anthropic/client";
import { calculateXp } from "@/lib/xp/calculateXp";
import { NextRequest, NextResponse } from "next/server";

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { project_id, receipt_text, ai_question, ai_response } =
    await request.json();

  const { data: project } = await supabase
    .from("projects")
    .select("deposit_amount, daily_payout")
    .eq("id", project_id)
    .eq("user_id", user.id)
    .single();

  if (!project) {
    console.error("verify: project not found", { project_id, user_id: user.id });
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("current_streak, longest_streak, xp")
    .eq("id", user.id)
    .single();

  if (!profile) {
    console.error("verify: profile not found", { user_id: user.id });
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const newStreak = profile.current_streak + 1;
  const newLongestStreak = Math.max(profile.longest_streak, newStreak);

  const xpEarned = calculateXp({
    depositAmountCents: project.deposit_amount,
    dailyPayoutCents: project.daily_payout,
    streakDays: newStreak,
  });

  const systemPrompt = `You are the voice of Receipt — an accountability app where people put money on the line to get real work done.

Someone just answered your follow-up question about today's work. Close out this check-in with a short confirmation.

Rules:
- Reference something specific from their answer. Show you actually read it.
- One to three sentences.
- End the message with exactly this line on its own: "${formatCents(project.daily_payout)} released. See you tomorrow."
- Tone: warm, direct, like a friend who's seen you show up.
- No corporate language. Never say "verification complete."
- Respond with ONLY the closing message.

What they did today: ${receipt_text}
The question you asked: ${ai_question}`;

  let closingMessage = "";

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 250,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: ai_response,
        },
      ],
    });

    closingMessage =
      message.content[0].type === "text" ? message.content[0].text : "";
  } catch (aiError) {
    console.error("verify: anthropic call failed", aiError);
    return NextResponse.json(
      { error: "AI verification failed", details: String(aiError) },
      { status: 502 }
    );
  }

  const { data: checkIn, error: checkInError } = await supabase
    .from("check_ins")
    .insert({
      project_id,
      user_id: user.id,
      receipt_text,
      ai_question,
      ai_response,
      verified: true,
      xp_earned: xpEarned,
    })
    .select()
    .single();

  if (checkInError) {
    console.error("verify: check_ins insert failed", checkInError);
    return NextResponse.json({ error: checkInError.message }, { status: 500 });
  }

  const { error: payoutError } = await supabase
    .from("payouts")
    .insert({
      user_id: user.id,
      project_id,
      check_in_id: checkIn.id,
      amount: project.daily_payout,
      status: "pending",
    });

  if (payoutError) {
    console.error("verify: payouts insert failed", payoutError);
    return NextResponse.json({ error: payoutError.message }, { status: 500 });
  }

  const { error: profileError } = await supabase
    .from("users")
    .update({
      xp: profile.xp + xpEarned,
      current_streak: newStreak,
      longest_streak: newLongestStreak,
    })
    .eq("id", user.id);

  if (profileError) {
    console.error("verify: users update failed", profileError);
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({
    closing_message: closingMessage,
    payout_amount: project.daily_payout,
    xp_earned: xpEarned,
  });
}
