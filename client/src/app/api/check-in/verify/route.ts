import { createClient } from "@/lib/supabase/server";
import { anthropic } from "@/lib/anthropic/client";
import { calculateXp } from "@/lib/xp/calculateXp";
import { NextRequest, NextResponse } from "next/server";
import { getLevelForXp, getLevelGroup } from "@/lib/xp/levels";
import { formatTaskList } from "@/lib/ai/formatTaskList";
import { getDateInTimezone } from "@/lib/date/getDateInTimezone";
import { stripe } from "@/lib/stripe/server";


function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

function getPrevWorkDay(dateString: string, workDays: number[]): string | null {
  const date = new Date(`${dateString}T00:00:00Z`);
  for (let i = 1; i <= 7; i++) {
    const prev = new Date(date);
    prev.setUTCDate(date.getUTCDate() - i);
    if (workDays.includes(prev.getUTCDay())) {
      return prev.toISOString().slice(0, 10);
    }
  }
  return null;
}

// POST /api/check-in/verify — AI-verify a check-in, award XP, update streak, log payout
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const {
    project_id,
    receipt_text,
    ai_question,
    ai_response,
    mode = "receipt",
  } = await request.json();

  const isReviewMode = mode === "weekly_review" || mode === "pending_review";

  const { data: project } = await supabase
    .from("projects")
    .select("deposit_amount, daily_payout, work_days")
    .eq("id", project_id)
    .eq("user_id", user.id)
    .single();

  if (!project) {
    console.error("verify: project not found", { project_id, user_id: user.id });
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

  let weekHistory = "";
  let recentCheckInCount = 0;

  if (isReviewMode) {
    const { data: recentCheckIns, error: checkInsError } = await supabase
      .from("check_ins")
      .select("check_in_date, receipt_text, ai_question, ai_response")
      .eq("project_id", project_id)
      .eq("user_id", user.id)
      .order("check_in_date", { ascending: false })
      .limit(5);

    if (checkInsError) {
      console.error("verify: weekly check-ins fetch failed", checkInsError);
    }

    recentCheckInCount = recentCheckIns?.length ?? 0;

    weekHistory =
      recentCheckIns && recentCheckIns.length > 0
        ? recentCheckIns
            .map(
              (c) =>
                `${c.check_in_date}:\n  Receipt: ${c.receipt_text}\n  Question: ${c.ai_question}\n  Answer: ${c.ai_response}`
            )
            .join("\n\n")
        : "No prior check-ins this week.";
  }

  const { data: profile } = await supabase
  .from("users")
  .select(
    "current_streak, longest_streak, xp, level, last_check_in_date, timezone, streak_saves_available, stripe_account_id"
  )
  .eq("id", user.id)
  .single();


  if (!profile) {
    console.error("verify: profile not found", { user_id: user.id });
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const today = getDateInTimezone(new Date(), profile.timezone);
  const workDays = project.work_days ?? [1, 2, 3, 4, 5];
  const prevWorkDay = getPrevWorkDay(today, workDays);

  let newStreak: number;
  let streakReset = false;
  let streakSaveUsed = false;

  if (profile.last_check_in_date === today) {
    newStreak = profile.current_streak || 1;
  } else if (profile.last_check_in_date === prevWorkDay) {
    newStreak = profile.current_streak + 1;
  } else if (profile.streak_saves_available > 0 && profile.current_streak > 0) {
    streakSaveUsed = true;
    newStreak = profile.current_streak + 1;
  } else {
    streakReset = profile.current_streak > 0;
    newStreak = 1;
  }

  const newLongestStreak = Math.max(profile.longest_streak, newStreak);

  const baseXpEarned = calculateXp({
    depositAmountCents: project.deposit_amount,
    dailyPayoutCents: project.daily_payout,
    streakDays: newStreak,
  });

  // weekly review XP multiplier: 5/5 days = 1.5x, 4/5 = 1.2x, else no bonus
  let xpMultiplier = 1.0;
  if (isReviewMode) {
    if (recentCheckInCount >= 5) xpMultiplier = 1.5;
    else if (recentCheckInCount >= 4) xpMultiplier = 1.2;
  }

  const xpEarned = Math.round(baseXpEarned * xpMultiplier);

  const newXp = profile.xp + xpEarned;
  const newLevel = getLevelForXp(newXp);
  const leveledUp = newLevel > profile.level;
  const groupChanged =
    leveledUp && getLevelGroup(newLevel) !== getLevelGroup(profile.level);

  // weekly_review (done during off-day window) earns a streak save token
  // pending_review (overdue, done on a work day) does not
  const streakSaveEarned = mode === "weekly_review";
  const streakSaveDelta = (streakSaveEarned ? 1 : 0) - (streakSaveUsed ? 1 : 0);

  const closingLine =
    mode === "pending_review"
      ? `${formatCents(project.daily_payout)} released. Now let's see today's receipt.`
      : `${formatCents(project.daily_payout)} released. See you tomorrow.`;

  let systemPrompt: string;

  if (isReviewMode) {
    systemPrompt = `You are the voice of Receipt — an accountability app where people put money on the line to get real work done.

    Today is the weekly review. Someone just completed their review: they wrote a week-in-review receipt and answered a deep reflection question. Close out the week.

    Rules:
    - Reference something specific from their answer AND something from the broader week.
    - Acknowledge a pattern or growth you see across the week — specific, not generic.
    - Two to four sentences.
    - End the message with exactly this line on its own: "${closingLine}"
    - Tone: like a mentor who watched you show up all week and actually noticed.
    - No corporate language. Never say "verification complete."
    - Respond with ONLY the closing message.

    Their week-in-review receipt: ${receipt_text}
    The reflection question you asked: ${ai_question}
    Their answer: ${ai_response}

    Past check-ins this week (${recentCheckInCount} of 5 days):
    ${weekHistory}

    Project roadmap:
    ${roadmap}`;
  } else {
    systemPrompt = `You are the voice of Receipt — an accountability app where people put money on the line to get real work done.

    Someone just answered your follow-up question about today's work. Close out this check-in with a short confirmation.

    Rules:
    - Reference something specific from their answer. Show you actually read it.
    - If they checked off roadmap steps today, acknowledge that progress.
    - One to three sentences.
    - End the message with exactly this line on its own: "${closingLine}"
    - Tone: warm, direct, like a friend who's seen you show up.
    - No corporate language. Never say "verification complete."
    - Respond with ONLY the closing message.

    What they did today: ${receipt_text}
    The question you asked: ${ai_question}

    Project roadmap:
    ${roadmap}
    ${completedTodayLine}`;
  }

  let closingMessage = "";

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 250,
      system: systemPrompt,
      messages: [{ role: "user", content: ai_response }],
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
      check_in_date: today,
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

  if (profile.stripe_account_id) {
    try {
      const transfer = await stripe.transfers.create({
        amount: project.daily_payout,
        currency: "usd",
        destination: profile.stripe_account_id,
        metadata: {
          check_in_id: checkIn.id,
          project_id,
          user_id: user.id,
        },
      });

      const { error: payoutUpdateError } = await supabase
        .from("payouts")
        .update({
          status: "released",
          stripe_transfer_id: transfer.id,
        })
        .eq("check_in_id", checkIn.id);

      if (payoutUpdateError) {
        console.error("verify: payout status update failed", payoutUpdateError);
      }
    } catch (transferError) {
      console.error("verify: stripe transfer failed", transferError);
      // payout stays "pending" — will be retried once bank account is linked
    }
  }


  const { error: profileError } = await supabase
    .from("users")
    .update({
      xp: newXp,
      level: newLevel,
      current_streak: newStreak,
      longest_streak: newLongestStreak,
      last_check_in_date: today,
      ...(streakSaveDelta !== 0 && {
        streak_saves_available: profile.streak_saves_available + streakSaveDelta,
      }),
    })
    .eq("id", user.id);

  if (profileError) {
    console.error("verify: users update failed", profileError);
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  if (isReviewMode) {
    const { error: reviewError } = await supabase
      .from("projects")
      .update({ last_weekly_review_date: today })
      .eq("id", project_id)
      .eq("user_id", user.id);

    if (reviewError) {
      console.error("verify: last_weekly_review_date update failed", reviewError);
    }
  }

  return NextResponse.json({
    closing_message: closingMessage,
    payout_amount: project.daily_payout,
    xp_earned: xpEarned,
    xp_multiplier: xpMultiplier,
    new_level: newLevel,
    leveled_up: leveledUp,
    level_group: getLevelGroup(newLevel),
    group_changed: groupChanged,
    streak_reset: streakReset,
    streak_save_used: streakSaveUsed,
    streak_save_earned: streakSaveEarned,
  });
}
