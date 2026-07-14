// ── IMPORTS ───────────────────────────────────────────────────────────────────
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe/server";
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

  const body = await request.json();

  const {
    title,
    description,
    deposit_amount,
    daily_payout,
    start_date,
    end_date,
    work_days,
    work_style,
    obstacle_patterns,
    good_day_description,
    hard_day_description,
    tasks,
    stripe_payment_intent_id,
  } = body;

  const paymentIntent = await stripe.paymentIntents.retrieve(
    stripe_payment_intent_id
  );

  if (paymentIntent.status !== "succeeded") {
    console.error("projects: payment not confirmed", {
      stripe_payment_intent_id,
      status: paymentIntent.status,
    });
    return NextResponse.json(
      { error: "Payment not confirmed", details: paymentIntent.status },
      { status: 402 }
    );
  }

  const { data: profile, error: profileError } = await db
    .from("users")
    .select("work_style, subscription_tier")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    console.error("projects: profile fetch failed", profileError);
    return NextResponse.json(
      { error: "Profile not found", details: profileError?.message },
      { status: 404 }
    );
  }

  if (profile.subscription_tier === "standard") {
    const { count } = await db
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "active");

    if (count !== null && count >= 1) {
      return NextResponse.json(
        { error: "upgrade_required" },
        { status: 403 }
      );
    }
  }

  if (!profile.work_style) {
    const { error: profileUpdateError } = await db
      .from("users")
      .update({ work_style, obstacle_patterns })
      .eq("id", user.id);

    if (profileUpdateError) {
      console.error("projects: users update failed", profileUpdateError);
      return NextResponse.json(
        { error: profileUpdateError.message },
        { status: 500 }
      );
    }
  }

  const { data: project, error: projectError } = await db
    .from("projects")
    .insert({
      user_id: user.id,
      title,
      description,
      deposit_amount,
      daily_payout,
      start_date,
      end_date,
      work_days,
      good_day_description,
      hard_day_description,
      stripe_payment_intent_id,
      status: "active",
    })
    .select()
    .single();

  if (projectError) {
    console.error("projects: insert failed", projectError);
    return NextResponse.json(
      { error: projectError.message, details: projectError.code },
      { status: 500 }
    );
  }

  if (tasks && tasks.length > 0) {
    const taskRows = tasks.map((taskTitle: string, index: number) => ({
      project_id: project.id,
      user_id: user.id,
      title: taskTitle,
      position: index,
    }));

    const { error: tasksError } = await db
      .from("project_tasks")
      .insert(taskRows);

    if (tasksError) {
      console.error("projects: tasks insert failed", tasksError);
      return NextResponse.json(
        { error: tasksError.message, details: tasksError.code },
        { status: 500 }
      );
    }
  }

  const { error: onboardedError } = await db
    .from("users")
    .update({ onboarded: true })
    .eq("id", user.id);

  if (onboardedError) {
    console.error("projects: onboarded update failed", onboardedError);
  }

  return NextResponse.json({ project });
}
