import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/server";
import { NextRequest, NextResponse } from "next/server";

// POST /api/stripe/connect — create a Stripe Connect Express account and return the onboarding URL
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("stripe_account_id, stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  let accountId = profile.stripe_account_id;

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      email: user.email,
      metadata: { supabase_user_id: user.id },
    });

    accountId = account.id;

    const { error: updateError } = await supabase
      .from("users")
      .update({ stripe_account_id: accountId })
      .eq("id", user.id);

    if (updateError) {
      console.error("stripe/connect: stripe_account_id update failed", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
  }

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/connect`,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    type: "account_onboarding",
  });

  return NextResponse.json({ url: accountLink.url });
}
