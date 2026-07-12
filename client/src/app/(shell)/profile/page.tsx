// ── IMPORTS ───────────────────────────────────────────────────────────────────
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getLevelGroup } from "@/lib/xp/levels";
import PrivacyToggle from "../settings/privacy/_components/PrivacyToggle";

// ── PAGE ──────────────────────────────────────────────────────────────────────
export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile, error } = await supabase
    .from("users")
    .select("name, level, xp, current_streak, longest_streak, profile_public")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("profile page: fetch failed", error);
  }

  const levelGroup = getLevelGroup(profile?.level ?? 1);
  const profileUrl = `${process.env.NEXT_PUBLIC_APP_URL}/profile/${user.id}`;

  return (
    <main className="min-h-screen bg-[#0A0A0A] px-6 py-12">
      <div className="w-full max-w-sm mx-auto flex flex-col gap-10">

        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-[#F0EDEA]">
            {profile?.name ?? "Your profile"}
          </h1>
          <p className="text-sm text-[#6B6B6B]">
            Level {profile?.level ?? 1} · {levelGroup}
          </p>
        </div>

        {/* Stats */}
        <div className="flex flex-col gap-3">
          <span className="text-xs text-[#6B6B6B] uppercase tracking-wide">
            Stats
          </span>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center px-5 py-4 bg-[#111111] border border-[#1F1F1F] rounded-md">
              <span className="text-sm text-[#6B6B6B]">XP</span>
              <span className="text-sm font-semibold text-[#F0EDEA]">
                {profile?.xp ?? 0}
              </span>
            </div>
            <div className="flex justify-between items-center px-5 py-4 bg-[#111111] border border-[#1F1F1F] rounded-md">
              <span className="text-sm text-[#6B6B6B]">Current streak</span>
              <span className="text-sm font-semibold text-[#F0EDEA]">
                {profile?.current_streak ?? 0} days
              </span>
            </div>
            <div className="flex justify-between items-center px-5 py-4 bg-[#111111] border border-[#1F1F1F] rounded-md">
              <span className="text-sm text-[#6B6B6B]">Longest streak</span>
              <span className="text-sm font-semibold text-[#F0EDEA]">
                {profile?.longest_streak ?? 0} days
              </span>
            </div>
          </div>
        </div>

        {/* Privacy + public link */}
        <div className="flex flex-col gap-3">
          <span className="text-xs text-[#6B6B6B] uppercase tracking-wide">
            Public profile
          </span>
          <PrivacyToggle
            initialValue={profile?.profile_public ?? true}
            profileUrl={profileUrl}
          />
        </div>

      </div>
    </main>
  );
}
