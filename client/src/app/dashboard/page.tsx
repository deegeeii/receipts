import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

function formatCents(cents: number): string {
  return `$${(cents / 100).toLocaleString()}`;
}

function daysRemaining(endDate: string): number {
  const end = new Date(endDate);
  const today = new Date();
  const diff = end.getTime() - today.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("users")
    .select("name, level, xp, current_streak")
    .eq("id", user.id)
    .single();

  const { data: activeProject } = await supabase
    .from("projects")
    .select("id, title, deposit_amount, daily_payout, end_date")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let checkedInToday = false;

  if (activeProject) {
    const today = new Date().toISOString().slice(0, 10);

    const { data: todayCheckIn } = await supabase
      .from("check_ins")
      .select("id")
      .eq("project_id", activeProject.id)
      .eq("check_in_date", today)
      .maybeSingle();

    checkedInToday = !!todayCheckIn;
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] px-6 py-12">
      <div className="w-full max-w-sm mx-auto flex flex-col gap-10">

        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-[#F0EDEA]">
            {profile?.name ? `Welcome back, ${profile.name}` : "Welcome back"}
          </h1>
          <p className="text-sm text-[#6B6B6B]">
            Level {profile?.level ?? 1} · {profile?.xp ?? 0} XP ·{" "}
            {profile?.current_streak ?? 0} day streak
          </p>
        </div>

        {activeProject ? (
          <div className="flex flex-col gap-5">

            <div className="flex flex-col gap-3 px-5 py-5 bg-[#111111] border border-[#1F1F1F] rounded-md">
              <div className="flex justify-between items-baseline">
                <span className="text-lg font-semibold text-[#F0EDEA]">
                  {activeProject.title}
                </span>
                <span className="text-xs text-[#6B6B6B]">
                  {daysRemaining(activeProject.end_date)} days left
                </span>
              </div>

              <div className="flex justify-between items-baseline">
                <span className="text-xs text-[#6B6B6B] uppercase tracking-wide">
                  Deposit
                </span>
                <span className="text-sm font-semibold text-[#C9A84C]">
                  {formatCents(activeProject.deposit_amount)}
                </span>
              </div>

              <div className="flex justify-between items-baseline">
                <span className="text-xs text-[#6B6B6B] uppercase tracking-wide">
                  Daily payout
                </span>
                <span className="text-sm font-semibold text-[#F0EDEA]">
                  {formatCents(activeProject.daily_payout)}
                </span>
              </div>
            </div>

            {checkedInToday ? (
              <div className="text-center py-4 border border-[#1F1F1F] rounded-md">
                <span className="text-sm text-[#2D6A4F] font-semibold">
                  Receipt logged. See you tomorrow.
                </span>
              </div>
            ) : (
              <Link
                href={`/check-in/${activeProject.id}`}
                className="w-full py-4 bg-[#C9A84C] text-[#0A0A0A] font-semibold text-base rounded-md tracking-wide text-center hover:bg-[#E5C97A] transition-colors"
              >
                Drop your receipt
              </Link>
            )}

          </div>
        ) : (
          <div className="flex flex-col gap-4 items-center text-center py-10">
            <p className="text-sm text-[#6B6B6B]">
              No active project yet. Time to put something on the line.
            </p>
            <Link
              href="/projects/new"
              className="w-full max-w-[200px] py-4 bg-[#C9A84C] text-[#0A0A0A] font-semibold text-base rounded-md tracking-wide text-center hover:bg-[#E5C97A] transition-colors"
            >
              Start a project
            </Link>
          </div>
        )}

      </div>
    </main>
  );
}
