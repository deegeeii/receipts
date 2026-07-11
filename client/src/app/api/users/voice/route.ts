// ── IMPORTS ───────────────────────────────────────────────────────────────────
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { AiVoice } from "@/lib/ai/getVoiceTone";

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const VALID_VOICES: AiVoice[] = [
  "warm",
  "coach",
  "mentor",
  "challenger",
  "mamba",
];

// ── HANDLER ───────────────────────────────────────────────────────────────────
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { voice } = await request.json();

  if (!VALID_VOICES.includes(voice)) {
    return NextResponse.json({ error: "Invalid voice" }, { status: 400 });
  }

  const { error } = await supabase
    .from("users")
    .update({ ai_voice: voice })
    .eq("id", user.id);

  if (error) {
    console.error("voice: update failed", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
