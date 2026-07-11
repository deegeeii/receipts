// ── IMPORTS ───────────────────────────────────────────────────────────────────
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// ── HANDLER ───────────────────────────────────────────────────────────────────
export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("level")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const { data: buddies } = await supabase.rpc("get_my_buddies");
  const buddyIds = (buddies ?? []).map((b: { id: string }) => b.id);
  const excludeIds = [user.id, ...buddyIds];

  const minLevel = Math.max(1, (profile.level ?? 1) - 3);
  const maxLevel = (profile.level ?? 1) + 3;

  const { data: candidates, error } = await supabase
    .from("users")
    .select("id, name, level, current_streak, invite_code")
    .gte("level", minLevel)
    .lte("level", maxLevel)
    .not("invite_code", "is", null)
    .not("id", "in", `(${excludeIds.join(",")})`)
    .limit(20);

  if (error) {
    console.error("crew match: candidates fetch failed", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!candidates || candidates.length === 0) {
    return NextResponse.json({ match: null });
  }

  const match = candidates[Math.floor(Math.random() * candidates.length)];

  return NextResponse.json({ match });
}
