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

  const { data: profile, error: profileError } = await db
    .from("users")
    .select("level")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    console.error("crew match: profile fetch failed", profileError);
    return NextResponse.json(
      { error: "Profile not found", details: profileError?.message },
      { status: 404 }
    );
  }

  const { data: buddies, error: buddiesError } = await db.rpc("get_my_buddies");

  if (buddiesError) {
    console.error("crew match: get_my_buddies failed", buddiesError);
    return NextResponse.json(
      { error: "Could not load buddies", details: buddiesError.message },
      { status: 500 }
    );
  }

  const buddyIds = (buddies ?? []).map((b: { id: string }) => b.id);
  const excludeIds = [user.id, ...buddyIds];

  const minLevel = Math.max(1, (profile.level ?? 1) - 3);
  const maxLevel = (profile.level ?? 1) + 3;

  const { data: candidates, error: candidatesError } = await db
    .from("users")
    .select("id, name, level, current_streak, invite_code")
    .gte("level", minLevel)
    .lte("level", maxLevel)
    .not("invite_code", "is", null)
    .not("id", "in", `(${excludeIds.join(",")})`)
    .limit(20);

  if (candidatesError) {
    console.error("crew match: candidates fetch failed", candidatesError);
    return NextResponse.json(
      { error: candidatesError.message, details: candidatesError.code },
      { status: 500 }
    );
  }

  if (!candidates || candidates.length === 0) {
    return NextResponse.json({ match: null });
  }

  const match = candidates[Math.floor(Math.random() * candidates.length)];

  return NextResponse.json({ match });
}
