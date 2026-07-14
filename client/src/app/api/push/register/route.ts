// ── IMPORTS ───────────────────────────────────────────────────────────────────
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
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

  const { token: pushToken } = await request.json();

  if (!pushToken || typeof pushToken !== "string") {
    return NextResponse.json(
      { error: "Missing push token" },
      { status: 400 }
    );
  }

  const { error } = await db
    .from("users")
    .update({ expo_push_token: pushToken })
    .eq("id", user.id);

  if (error) {
    console.error("push/register: update failed", error);
    return NextResponse.json(
      { error: error.message, details: error.code },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
