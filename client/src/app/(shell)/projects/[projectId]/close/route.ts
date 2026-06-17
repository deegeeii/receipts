// ── IMPORTS ───────────────────────────────────────────────────────────────────
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/server";
import { NextRequest, NextResponse } from "next/server";

// ── TYPES ─────────────────────────────────────────────────────────────────────
type RouteParams = {
  params: Promise<{ projectId: string }>;
};

// ── HANDLER ───────────────────────────────────────────────────────────────────
// POST /api/projects/[projectId]/close — complete or cancel a project, release remaining balance
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { projectId } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { action } = await request.json();

  if (action !== "complete" && action !== "cancel") {
    return NextResponse.json(
      { error: "action must be complete or cancel" },
      { status: 400 }
    );
  }

  const { data: project } = await supabase
    .from("projects")
    .select("id, deposit_amount, status")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (project.status !== "active") {
    return NextResponse.json(
      { error: "Project is not active" },
      { status: 400 }
    );
  }

  const { data: releasedPayouts } = await supabase
    .from("payouts")
    .select("amount")
    .eq("project_id", projectId)
    .eq("status", "released");

  const totalReleased = (releasedPayouts ?? []).reduce(
    (sum, p) => sum + p.amount,
    0
  );

  const remainingBalance = project.deposit_amount - totalReleased;

  if (remainingBalance <= 0) {
    const { error: statusError } = await supabase
      .from("projects")
      .update({
        status: action === "complete" ? "completed" : "cancelled",
        ...(action === "complete"
          ? { completed_at: new Date().toISOString() }
          : { cancelled_at: new Date().toISOString() }),
      })
      .eq("id", projectId);

    if (statusError) {
      console.error("close: project status update failed", statusError);
      return NextResponse.json({ error: statusError.message }, { status: 500 });
    }

    return NextResponse.json({ status: action === "complete" ? "completed" : "cancelled" });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("stripe_account_id")
    .eq("id", user.id)
    .single();

  // 10% penalty on remaining balance if cancelling early
  const transferAmount =
    action === "cancel"
      ? Math.floor(remainingBalance * 0.9)
      : remainingBalance;

  if (profile?.stripe_account_id && transferAmount > 0) {
    try {
      await stripe.transfers.create({
        amount: transferAmount,
        currency: "usd",
        destination: profile.stripe_account_id,
        metadata: {
          project_id: projectId,
          user_id: user.id,
          action,
        },
      });
    } catch (transferError) {
      console.error("close: stripe transfer failed", transferError);
      return NextResponse.json(
        { error: "Transfer failed. Contact support." },
        { status: 502 }
      );
    }
  }

  const newStatus = action === "complete" ? "completed" : "cancelled";

  const { error: statusError } = await supabase
    .from("projects")
    .update({
      status: newStatus,
      ...(action === "complete"
        ? { completed_at: new Date().toISOString() }
        : { cancelled_at: new Date().toISOString() }),
    })
    .eq("id", projectId);

  if (statusError) {
    console.error("close: project status update failed", statusError);
    return NextResponse.json({ error: statusError.message }, { status: 500 });
  }

  return NextResponse.json({ status: newStatus, transferred: transferAmount });
}
