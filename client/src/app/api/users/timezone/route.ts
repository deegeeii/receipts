import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// PATCH /api/users/timezone — update the logged-in user's IANA timezone for date-aware streak logic
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  const { timezone } = await request.json();

  if (!timezone || typeof timezone !== "string") {
    return NextResponse.json(
      { error: "Missing timezone" },
      { status: 400 }
    );
  }

  const { error: updateError } = await supabase
    .from("users")
    .update({ timezone })
    .eq("id", user.id);

  if (updateError) {
    console.error("users/timezone: update failed", updateError);
    return NextResponse.json(
      { error: updateError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ timezone });
}
