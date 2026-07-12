// ── IMPORTS ───────────────────────────────────────────────────────────────────
import { createClient } from "@/lib/supabase/server";
import { getLevelGroup } from "@/lib/xp/levels";
import { notFound } from "next/navigation";
import ShareCard from "./_components/ShareCard";

// ── TYPES ─────────────────────────────────────────────────────────────────────
type Props = {
  params: Promise<{ userId: string }>;
};

// ── PAGE ──────────────────────────────────────────────────────────────────────
export default async function PublicProfilePage({ params }: Props) {
  const { userId } = await params;

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("users")
    .select("name, level, xp, current_streak, longest_streak, profile_public")
    .eq("id", userId)
    .single();

  if (!profile) notFound();

  if (!profile.profile_public) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0A] px-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-lg font-semibold text-[#F0EDEA]">
            This profile is private.
          </p>
          <p className="text-sm text-[#6B6B6B]">
            The user has chosen to keep their profile off the record.
          </p>
        </div>
      </main>
    );
  }

  const { count: activeProjectCount } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "active");

  const levelGroup = getLevelGroup(profile.level ?? 1);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0A] px-6 py-12">
      <div className="w-full max-w-sm flex flex-col gap-8">

        <div className="flex flex-col gap-1">
          <p className="text-xs text-[#6B6B6B] uppercase tracking-widest">
            Receipt
          </p>
          <h1 className="text-2xl font-bold text-[#F0EDEA]">
            {profile.name ?? "Anonymous"}
          </h1>
          <p className="text-sm text-[#6B6B6B]">
            Level {profile.level ?? 1} · {levelGroup}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center px-5 py-4 bg-[#111111] border border-[#1F1F1F] rounded-md">
            <span className="text-sm text-[#6B6B6B]">Current streak</span>
            <span className="text-sm font-semibold text-[#F0EDEA]">
              {profile.current_streak ?? 0} days
            </span>
          </div>
          <div className="flex justify-between items-center px-5 py-4 bg-[#111111] border border-[#1F1F1F] rounded-md">
            <span className="text-sm text-[#6B6B6B]">Longest streak</span>
            <span className="text-sm font-semibold text-[#F0EDEA]">
              {profile.longest_streak ?? 0} days
            </span>
          </div>
          <div className="flex justify-between items-center px-5 py-4 bg-[#111111] border border-[#1F1F1F] rounded-md">
            <span className="text-sm text-[#6B6B6B]">XP</span>
            <span className="text-sm font-semibold text-[#F0EDEA]">
              {profile.xp ?? 0}
            </span>
          </div>
          {(activeProjectCount ?? 0) > 0 && (
            <div className="flex justify-between items-center px-5 py-4 bg-[#111111] border border-[#1F1F1F] rounded-md">
              <span className="text-sm text-[#6B6B6B]">Active projects</span>
              <span className="text-sm font-semibold text-[#F0EDEA]">
                {activeProjectCount}
              </span>
            </div>
          )}
        </div>

        <ShareCard
          name={profile.name ?? "Anonymous"}
          level={profile.level ?? 1}
          levelGroup={levelGroup}
          streak={profile.current_streak ?? 0}
          longestStreak={profile.longest_streak ?? 0}
          xp={profile.xp ?? 0}
        />

      </div>
    </main>
  );
}
