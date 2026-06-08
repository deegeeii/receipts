import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = formData.get("email") as string;

  if (!email) {
    return NextResponse.redirect(
      new URL("/auth/email?error=missing_email", process.env.NEXT_PUBLIC_APP_URL)
    );
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) {
    return NextResponse.redirect(
      new URL("/auth/email?error=send_failed", process.env.NEXT_PUBLIC_APP_URL)
    );
  }

  return NextResponse.redirect(
    new URL("/auth/check-email", process.env.NEXT_PUBLIC_APP_URL)
  );
}
