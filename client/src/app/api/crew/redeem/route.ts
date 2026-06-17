import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// POST /api/crew/redeem — redeem a buddy's invite code, creating a mutual buddy link
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

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

  const { data, error } = await supabase.rpc("redeem_buddy_code", {
    code: code.trim(),
  });

  if (error) {
    console.error("crew: redeem failed", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const buddy = data?.[0] ?? null;

  return NextResponse.json({ buddy });
}
