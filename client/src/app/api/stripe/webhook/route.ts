// ── IMPORTS ───────────────────────────────────────────────────────────────────
import { stripe } from "@/lib/stripe/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

// ── HANDLER ───────────────────────────────────────────────────────────────────
// POST /api/stripe/webhook — handle Stripe events for payout failures and account updates
export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    console.error("webhook: missing stripe-signature header");
    return NextResponse.json(
      { error: "Missing signature" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("webhook: signature verification failed", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  if (event.type === "payout.failed") {
    const payout = event.data.object as Stripe.Payout;

    const { error } = await supabaseAdmin
      .from("payouts")
      .update({
        status: "pending",
        stripe_transfer_id: null,
      })
      .eq("stripe_transfer_id", payout.id);

    if (error) {
      console.error("webhook: payout reset failed", error);
    } else {
      console.log("webhook: payout.failed — payout reset to pending", {
        payout_id: payout.id,
      });
    }
  }

  if (event.type === "account.updated") {
    const account = event.data.object as Stripe.Account;

    console.log("webhook: account.updated", {
      account_id: account.id,
      payouts_enabled: account.payouts_enabled,
      charges_enabled: account.charges_enabled,
    });
  }

  return NextResponse.json({ received: true });
}
