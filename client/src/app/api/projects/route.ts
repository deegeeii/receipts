import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

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
      { error: "Payment not confirmed" },
      { status: 402 }
    );
  }

  const { data: profile } = await supabase
    .from("users")
    .select("work_style")
    .eq("id", user.id)
    .single();

  if (profile && !profile.work_style) {
    const { error: profileError } = await supabase
      .from("users")
      .update({ work_style, obstacle_patterns })
      .eq("id", user.id);

    if (profileError) {
      console.error("projects: users update failed", profileError);
      return NextResponse.json(
        { error: profileError.message },
        { status: 500 }
      );
    }
  }

  const { data: project, error: projectError } = await supabase
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
    return NextResponse.json({ error: projectError.message }, { status: 500 });
  }

  if (tasks && tasks.length > 0) {
    const taskRows = tasks.map((taskTitle: string, index: number) => ({
      project_id: project.id,
      user_id: user.id,
      title: taskTitle,
      position: index,
    }));

    const { error: tasksError } = await supabase
      .from("project_tasks")
      .insert(taskRows);

    if (tasksError) {
      console.error("projects: tasks insert failed", tasksError);
      return NextResponse.json(
        { error: tasksError.message },
        { status: 500 }
      );
    }
  }

  const { error: onboardedError } = await supabase
  .from("users")
  .update({ onboarded: true })
  .eq("id", user.id);

  if (onboardedError) {
    console.error("projects: onboarded update failed", onboardedError);
  }

  return NextResponse.json({ project });

}
