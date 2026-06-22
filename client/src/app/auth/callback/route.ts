// ── IMPORTS ───────────────────────────────────────────────────────────────────
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/server";
import { NextRequest, NextResponse } from "next/server";

// ── HANDLER ───────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("users")
          .select("stripe_customer_id, onboarded")
          .eq("id", user.id)
          .single();

        if (profile && !profile.stripe_customer_id) {
          const customer = await stripe.customers.create({
            email: user.email,
            metadata: { supabase_user_id: user.id },
          });

          const { error: updateError } = await supabase
            .from("users")
            .update({ stripe_customer_id: customer.id })
            .eq("id", user.id);

          if (updateError) {
            console.error(
              "callback: stripe_customer_id update failed",
              updateError
            );
          }
        }

        const destination =
          profile && profile.onboarded ? "/dashboard" : "/onboarding";

        return NextResponse.redirect(
          new URL(destination, process.env.NEXT_PUBLIC_APP_URL)
        );
      }

      return NextResponse.redirect(
        new URL("/dashboard", process.env.NEXT_PUBLIC_APP_URL)
      );
    }
  }

  return NextResponse.redirect(
    new URL("/auth/login", process.env.NEXT_PUBLIC_APP_URL)
  );
}
