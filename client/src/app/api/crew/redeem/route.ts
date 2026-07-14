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

  const { code } = await request.json();

  if (!code || !code.trim()) {
    return NextResponse.json(
      { error: "Invite code is required" },
      { status: 400 }
    );
  }

  const { data, error } = await db.rpc("redeem_buddy_code", {
    code: code.trim(),
  });

  if (error) {
    console.error("crew: redeem failed", error);
    return NextResponse.json(
      { error: error.message, details: error.code },
      { status: 400 }
    );
  }

  const buddy = data?.[0] ?? null;

  return NextResponse.json({ buddy });
}
