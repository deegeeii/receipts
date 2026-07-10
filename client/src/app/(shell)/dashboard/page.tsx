// ── IMPORTS ───────────────────────────────────────────────────────────────────
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getLevelGroup } from "@/lib/xp/levels";
import { getDateInTimezone } from "@/lib/date/getDateInTimezone";
import SetupPayoutsBanner from "./_components/SetupPayoutsBanner";
import OverdueBanner from "./_components/OverdueBanner";
import MissedDayModal from "./_components/MissedDayModal";
import ProjectCard from "./_components/ProjectCard";

// ── TYPES ─────────────────────────────────────────────────────────────────────
type Props = {
  searchParams: Promise<{ project?: string }>;
};

// ── PAGE ──────────────────────────────────────────────────────────────────────
export default async function DashboardPage({ searchParams }: Props) {
  const { project: selectedProjectId } = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("users")
    .select("name, level, xp, current_streak, timezone, stripe_account_id")
    .eq("id", user.id)
    .single();

  const levelGroup = getLevelGroup(profile?.level ?? 1);
  const today = getDateInTimezone(new Date(), profile?.timezone ?? "UTC");
  const monthStart = today.slice(0, 7) + "-01";

  const { data: activeProjects, error: projectsError } = await supabase
    .from("projects")
    .select("id, title, deposit_amount, daily_payout, end_date")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("deposit_amount", { ascending: false });

  if (projectsError) {
    console.error("dashboard: projects fetch failed", projectsError);
  }

  const projects = activeProjects ?? [];

  const project =
    projects.find((p) => p.id === selectedProjectId) ?? projects[0] ?? null;

  const overdueProjects = projects.filter((p) => p.end_date < today);

  let checkedInToday = false;
  let tasks: { id: string; title: string; completed: boolean }[] = [];
  let remainingBalance = 0;

  if (project) {
    const { data: checkIn } = await supabase
      .from("check_ins")
      .select("id")
      .eq("project_id", project.id)
      .eq("check_in_date", today)
      .single();

    checkedInToday = !!checkIn;

    const { data: allTasks } = await supabase
      .from("project_tasks")
      .select("id, title, completed")
      .eq("project_id", project.id)
      .order("position", { ascending: true });

    tasks = (allTasks ?? []).map((t) => ({
      id: t.id,
      title: t.title,
      completed: t.completed,
    }));

    const { data: releasedPayouts } = await supabase
      .from("payouts")
      .select("amount")
      .eq("project_id", project.id)
      .eq("status", "released");

    const totalReleased = (releasedPayouts ?? []).reduce(
      (sum, p) => sum + p.amount,
      0
    );

    remainingBalance = project.deposit_amount - totalReleased;
  }

  const { count: risksThisMonth } = await supabase
    .from("missed_days")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("missed_date", monthStart);

  return (
    <main className="min-h-screen bg-[#0A0A0A] px-6 py-12">
      <MissedDayModal />

      <div className="w-full max-w-sm mx-auto flex flex-col gap-10">

        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-[#F0EDEA]">
            {profile?.name ? `Welcome back, ${profile.name}` : "Welcome back"}
          </h1>
          <p className="text-sm text-[#6B6B6B]">
            Level {profile?.level ?? 1} · {levelGroup} · {profile?.xp ?? 0} XP ·{" "}
            {profile?.current_streak ?? 0} day streak
          </p>
          {(risksThisMonth ?? 0) > 0 && (
            <p className="text-xs text-[#6B6B6B]">
              You took {risksThisMonth} risk{risksThisMonth === 1 ? "" : "s"} this month.
            </p>
          )}
        </div>

        {!profile?.stripe_account_id && <SetupPayoutsBanner />}

        {overdueProjects.length > 0 && (
          <div className="flex flex-col gap-3">
            {overdueProjects.map((p) => (
              <OverdueBanner
                key={p.id}
                projectId={p.id}
                projectTitle={p.title}
                currentEndDate={p.end_date}
              />
            ))}
          </div>
        )}

        {project ? (
          <ProjectCard
            id={project.id}
            title={project.title}
            deposit_amount={project.deposit_amount}
            daily_payout={project.daily_payout}
            end_date={project.end_date}
            remaining_balance={remainingBalance}
            checkedInToday={checkedInToday}
            streak={profile?.current_streak ?? 0}
            tasks={tasks}
            today={today}
          />
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
