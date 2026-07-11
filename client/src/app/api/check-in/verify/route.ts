// ── IMPORTS ───────────────────────────────────────────────────────────────────
import { createClient } from "@/lib/supabase/server";
import { anthropic } from "@/lib/anthropic/client";
import { calculateXp } from "@/lib/xp/calculateXp";
import { NextRequest, NextResponse } from "next/server";
import { getLevelForXp, getLevelGroup } from "@/lib/xp/levels";
import { formatTaskList } from "@/lib/ai/formatTaskList";
import { getDateInTimezone } from "@/lib/date/getDateInTimezone";
import { getVoiceTone } from "@/lib/ai/getVoiceTone";
import { stripe } from "@/lib/stripe/server";

// ── HELPERS ───────────────────────────────────────────────────────────────────
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

// ── HANDLER ───────────────────────────────────────────────────────────────────
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
    ai_question = "",
    ai_response = "",
    ai_question2 = "",
    ai_response2 = "",
    mystery_format = "",
    mode: rawMode = "receipt",
    short_mode_pass_used = false,
  } = await request.json();

  const mode = short_mode_pass_used ? "light_day" : rawMode;
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
      "current_streak, longest_streak, xp, level, last_check_in_date, timezone, streak_saves_available, stripe_account_id, ai_voice, short_mode_passes, freeze_days_available"
    )
    .eq("id", user.id)
    .single();

  if (!profile) {
    console.error("verify: profile not found", { user_id: user.id });
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  if (short_mode_pass_used && (profile.short_mode_passes ?? 0) < 1) {
    return NextResponse.json({ error: "No short mode passes remaining" }, { status: 400 });
  }

  const toneLine = getVoiceTone(profile.ai_voice ?? "warm");
  const today = getDateInTimezone(new Date(), profile.timezone);
  const workDays = project.work_days ?? [1, 2, 3, 4, 5];
  const prevWorkDay = getPrevWorkDay(today, workDays);

  // ── BUDDY BONUS ────────────────────────────────────────────────────────────
  let buddyBonusXp = 0;
  let buddyMatchNames: string[] = [];

  const { data: myBuddies } = await supabase.rpc("get_my_buddies");
  const buddyIds = (myBuddies ?? []).map((b: { id: string }) => b.id);

  if (buddyIds.length > 0) {
    const { data: buddyCheckIns } = await supabase
      .from("check_ins")
      .select("user_id")
      .eq("check_in_date", today)
      .in("user_id", buddyIds);

    const matchedIds = (buddyCheckIns ?? [])
      .map((c) => c.user_id)
      .slice(0, 3);

    buddyMatchNames = (myBuddies ?? [])
      .filter((b: { id: string; name: string | null }) => matchedIds.includes(b.id))
      .map((b: { id: string; name: string | null }) => b.name ?? "Anonymous");

    buddyBonusXp = matchedIds.length * 10;
  }

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

  // ── MILESTONE ITEM AWARDS ──────────────────────────────────────────────────
  const isNewStreakMilestone = newStreak > (profile.current_streak ?? 0);
  const shortModePassEarned =
    isNewStreakMilestone && newStreak % 7 === 0 ? 1 : 0;
  const freezeDayEarned =
    isNewStreakMilestone && newStreak % 14 === 0 ? 1 : 0;
  const streakSaveFromMilestone =
    isNewStreakMilestone && newStreak % 30 === 0 ? 1 : 0;

  const baseXpEarned = calculateXp({
    depositAmountCents: project.deposit_amount,
    dailyPayoutCents: project.daily_payout,
    streakDays: newStreak,
  });

  let xpMultiplier = 1.0;
  if (isReviewMode) {
    if (recentCheckInCount >= 5) xpMultiplier = 1.5;
    else if (recentCheckInCount >= 4) xpMultiplier = 1.2;
  } else if (rawMode === "heavy_day") {
    xpMultiplier = 1.25;
  } else if (rawMode === "mystery_door") {
    xpMultiplier = 1.15;
  }

  const xpEarned = Math.round(baseXpEarned * xpMultiplier);
  const newXp = profile.xp + xpEarned + buddyBonusXp;
  const newLevel = getLevelForXp(newXp);
  const leveledUp = newLevel > profile.level;
  const groupChanged =
    leveledUp && getLevelGroup(newLevel) !== getLevelGroup(profile.level);

  const streakSaveEarned = mode === "weekly_review";
  const streakSaveDelta =
    (streakSaveEarned ? 1 : 0) +
    streakSaveFromMilestone -
    (streakSaveUsed ? 1 : 0);

  const closingLine =
    mode === "pending_review"
      ? `${formatCents(project.daily_payout)} released. Now let's see today's receipt.`
      : `${formatCents(project.daily_payout)} released. See you tomorrow.`;

  // ── AI CLOSING MESSAGE ─────────────────────────────────────────────────────
  const MYSTERY_FORMAT_LABELS: Record<string, string> = {
    timed_write: "a timed free-write",
    ai_quiz: "a three-question quiz",
    one_word_expand: "a one-word expand",
    gut_check: "a gut check rating",
    draw_a_scene: "a scene description",
  };

  let systemPrompt: string;

  if (rawMode === "mystery_door") {
    const formatLabel =
      MYSTERY_FORMAT_LABELS[mystery_format] ?? "a mystery format";
    systemPrompt = `You are the voice of Receipt — an accountability app where people put money on the line to get real work done.

    Today someone went through the Mystery Door and completed ${formatLabel}. Close out this check-in.

    Rules:
    - Reference something specific from what they wrote. Show you actually read it.
    - Acknowledge that they chose the harder, more interesting path today.
    - One to two sentences, then the closing line.
    - End the message with exactly this line on its own: "${closingLine}"
    - ${toneLine}
    - No corporate language. Never say "verification complete."
    - Respond with ONLY the closing message.

    What they submitted: ${receipt_text}

    Project roadmap:
    ${roadmap}
    ${completedTodayLine}`;

  } else if (mode === "light_day") {
    systemPrompt = `You are the voice of Receipt — an accountability app where people put money on the line to get real work done.

    Someone just logged a quick check-in${short_mode_pass_used ? " using a short mode pass" : " on a light day"}. Acknowledge what they did in one warm, specific sentence — then end with exactly this line on its own: "${closingLine}"

    Rules:
    - Reference something concrete from their receipt. Show you actually read it.
    - One sentence of acknowledgment, then the closing line. Nothing else.
    - ${toneLine}
    - No corporate language.
    - Respond with ONLY the closing message.

    What they did today: ${receipt_text}

    Project roadmap:
    ${roadmap}
    ${completedTodayLine}`;

  } else if (mode === "heavy_day") {
    systemPrompt = `You are the voice of Receipt — an accountability app where people put money on the line to get real work done.

    Today was this person's Peak Day — their most important work day of the week. They dropped a full receipt and answered two deep questions. Close out the day.

    Rules:
    - Reference something specific from their receipt AND weave in something from their answers.
    - Acknowledge the depth — this was a heavy day and they showed up for it.
    - Two to three sentences.
    - End the message with exactly this line on its own: "${closingLine}"
    - ${toneLine}
    - No corporate language. Never say "verification complete."
    - Respond with ONLY the closing message.

    What they did today: ${receipt_text}
    Question 1: ${ai_question}
    Their answer: ${ai_response}
    Question 2: ${ai_question2}
    Their answer: ${ai_response2}

    Project roadmap:
    ${roadmap}
    ${completedTodayLine}`;

  } else if (isReviewMode) {
    systemPrompt = `You are the voice of Receipt — an accountability app where people put money on the line to get real work done.

    Today is the weekly review. Someone just completed their review: they wrote a week-in-review receipt and answered a deep reflection question. Close out the week.

    Rules:
    - Reference something specific from their answer AND something from the broader week.
    - Acknowledge a pattern or growth you see across the week — specific, not generic.
    - Two to four sentences.
    - End the message with exactly this line on its own: "${closingLine}"
    - ${toneLine}
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
    - ${toneLine}
    - No corporate language. Never say "verification complete."
    - Respond with ONLY the closing message.

    What they did today: ${receipt_text}
    The question you asked: ${ai_question}
    Their answer: ${ai_response}

    Project roadmap:
    ${roadmap}
    ${completedTodayLine}`;
  }

  let closingMessage = "";

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 300,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content:
            mode === "light_day" || rawMode === "mystery_door"
              ? receipt_text
              : ai_response,
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

  // ── GROUP CHANGE SUMMARY ───────────────────────────────────────────────────
  let groupChangeSummary = "";

  if (groupChanged) {
    const { data: journeyCheckIns } = await supabase
      .from("check_ins")
      .select("check_in_date, receipt_text")
      .eq("project_id", project_id)
      .eq("user_id", user.id)
      .order("check_in_date", { ascending: false })
      .limit(10);

    const journeyText = (journeyCheckIns ?? [])
      .map((c) => `${c.check_in_date}: ${c.receipt_text}`)
      .join("\n");

    try {
      const summaryMsg = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 150,
        system: `You are the voice of Receipt — an accountability app. Someone just leveled up to ${getLevelGroup(newLevel)}. Write 2-3 sentences summarizing their journey based on their recent check-ins. Be specific about what you noticed. ${toneLine} No corporate language.`,
        messages: [{ role: "user", content: journeyText || "First check-in." }],
      });

      groupChangeSummary =
        summaryMsg.content[0].type === "text"
          ? summaryMsg.content[0].text
          : "";
    } catch (summaryError) {
      console.error("verify: group change summary failed", summaryError);
    }
  }

  // ── PERSIST ────────────────────────────────────────────────────────────────
  const { data: checkIn, error: checkInError } = await supabase
    .from("check_ins")
    .insert({
      project_id,
      user_id: user.id,
      receipt_text,
      ai_question: ai_question || null,
      ai_response: ai_response || null,
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
        .update({ status: "released", stripe_transfer_id: transfer.id })
        .eq("check_in_id", checkIn.id);

      if (payoutUpdateError) {
        console.error("verify: payout status update failed", payoutUpdateError);
      }
    } catch (transferError) {
      console.error("verify: stripe transfer failed", transferError);
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
        streak_saves_available:
          profile.streak_saves_available + streakSaveDelta,
      }),
      ...(shortModePassEarned - (short_mode_pass_used ? 1 : 0) !== 0 && {
        short_mode_passes:
          (profile.short_mode_passes ?? 0) +
          shortModePassEarned -
          (short_mode_pass_used ? 1 : 0),
      }),
      ...(freezeDayEarned > 0 && {
        freeze_days_available:
          (profile.freeze_days_available ?? 0) + freezeDayEarned,
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

  // ── RESPONSE ───────────────────────────────────────────────────────────────
  return NextResponse.json({
    closing_message: closingMessage,
    payout_amount: project.daily_payout,
    xp_earned: xpEarned,
    xp_multiplier: xpMultiplier,
    new_level: newLevel,
    leveled_up: leveledUp,
    level_group: getLevelGroup(newLevel),
    group_changed: groupChanged,
    group_change_summary: groupChangeSummary,
    streak_reset: streakReset,
    streak_save_used: streakSaveUsed,
    streak_save_earned: streakSaveEarned || streakSaveFromMilestone > 0,
    short_mode_pass_earned: shortModePassEarned > 0,
    freeze_day_earned: freezeDayEarned > 0,
    buddy_bonus_xp: buddyBonusXp,
    buddy_match_names: buddyMatchNames,
  });
}
