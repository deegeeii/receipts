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

  const { amount } = await request.json();

  if (!amount || typeof amount !== "number" || amount < 5000) {
    return NextResponse.json(
      { error: "Invalid deposit amount" },
      { status: 400 }
    );
  }

  const { data: profile, error: profileError } = await db
    .from("users")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    console.error("payment-intent: profile fetch failed", profileError);
    return NextResponse.json(
      { error: "Profile not found", details: profileError?.message },
      { status: 404 }
    );
  }

  let customerId = profile.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    });

    customerId = customer.id;

    const { error: updateError } = await db
      .from("users")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id);

    if (updateError) {
      console.error("payment-intent: customer_id save failed", updateError);
      return NextResponse.json(
        { error: "Could not save Stripe customer", details: updateError.message },
        { status: 500 }
      );
    }
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: "usd",
    customer: customerId,
    automatic_payment_methods: { enabled: true },
    metadata: { supabase_user_id: user.id },
  });

  return NextResponse.json({ client_secret: paymentIntent.client_secret });
}
