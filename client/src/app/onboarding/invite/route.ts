// ── IMPORTS ───────────────────────────────────────────────────────────────────
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const resend = new Resend(process.env.RESEND_API_KEY);

// ── HANDLER ───────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { supporterEmail } = await request.json();

  if (!supporterEmail) {
    return NextResponse.json({ error: "Missing supporterEmail" }, { status: 400 });
  }

  const { error } = await resend.emails.send({
    from: "Receipt <onboarding@resend.dev>",
    to: supporterEmail,
    subject: `${user.email} invited you to be their accountability partner`,
    html: `
      <p>Hey,</p>
      <p><strong>${user.email}</strong> just committed to a goal on <strong>Receipt</strong> — an app where you put money on the line and prove your progress daily.</p>
      <p>They added you as someone in their village. That means they want you to ask them how it's going.</p>
      <p>No action needed — just be someone who checks in.</p>
      <p style="color: #6B6B6B; font-size: 12px;">Receipt — Prove it. Get paid.</p>
    `,
  });

  if (error) {
    console.error("invite email failed", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
