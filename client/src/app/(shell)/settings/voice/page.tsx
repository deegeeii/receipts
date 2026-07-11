// ── IMPORTS ───────────────────────────────────────────────────────────────────
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import VoiceSelector from "./_components/VoiceSelector";

// ── PAGE ──────────────────────────────────────────────────────────────────────
export default async function VoicePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("users")
    .select("level, current_streak, ai_voice")
    .eq("id", user.id)
    .single();

  const level = profile?.level ?? 1;
  const streak = profile?.current_streak ?? 0;
  const currentVoice = (profile?.ai_voice ?? "warm") as string;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0A] px-6">
      <div className="w-full max-w-sm flex flex-col gap-8">

        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-[#F0EDEA]">
            AI voice
          </h2>
          <p className="text-sm text-[#6B6B6B]">
            Choose how Receipt talks to you. Unlock new voices as you level up.
          </p>
        </div>

        <VoiceSelector
          level={level}
          streak={streak}
          currentVoice={currentVoice}
        />

      </div>
    </main>
  );
}
