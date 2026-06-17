import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/server";
import { NextRequest, NextResponse } from "next/server";

// POST /api/stripe/payment-intent — create a PaymentIntent for a project deposit
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { amount } = await request.json();

  if (!amount || typeof amount !== "number" || amount < 5000) {
    return NextResponse.json(
      { error: "Invalid deposit amount" },
      { status: 400 }
    );
  }

  const { data: profile } = await supabase
    .from("users")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (!profile?.stripe_customer_id) {
    return NextResponse.json(
      { error: "Stripe customer not set up" },
      { status: 400 }
    );
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: "usd",
    customer: profile.stripe_customer_id,
    automatic_payment_methods: { enabled: true },
    metadata: { supabase_user_id: user.id },
  });

  return NextResponse.json({ client_secret: paymentIntent.client_secret });
}
