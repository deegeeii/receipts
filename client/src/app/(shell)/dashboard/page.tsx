// ── IMPORTS ───────────────────────────────────────────────────────────────────
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getLevelGroup } from "@/lib/xp/levels";
import { getDateInTimezone } from "@/lib/date/getDateInTimezone";
import ProjectSwitcher from "./_components/ProjectSwitcher";
import SetupPayoutsBanner from "./_components/SetupPayoutsBanner";
import OverdueBanner from "./_components/OverdueBanner";
import MissedDayModal from "./_components/MissedDayModal";

// ── PAGE ──────────────────────────────────────────────────────────────────────
export default async function DashboardPage() {
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
  const projectIds = projects.map((project) => project.id);
  const today = getDateInTimezone(new Date(), profile?.timezone ?? "UTC");

  const monthStart = today.slice(0, 7) + "-01";

  const { count: risksThisMonth } = await supabase
    .from("missed_days")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("missed_date", monthStart);


  let checkedInProjectIds = new Set<string>();
  let tasksByProject: Record<
    string,
    { id: string; title: string; completed: boolean }[]
  > = {};
  let releasedByProject: Record<string, number> = {};

  if (projectIds.length > 0) {
    const { data: todayCheckIns, error: checkInsError } = await supabase
      .from("check_ins")
      .select("project_id")
      .in("project_id", projectIds)
      .eq("check_in_date", today);

    if (checkInsError) {
      console.error("dashboard: check-ins fetch failed", checkInsError);
    } else {
      checkedInProjectIds = new Set(
        (todayCheckIns ?? []).map((checkIn) => checkIn.project_id)
      );
    }

    const { data: allTasks, error: tasksError } = await supabase
      .from("project_tasks")
      .select("id, project_id, title, completed")
      .in("project_id", projectIds)
      .order("position", { ascending: true });

    if (tasksError) {
      console.error("dashboard: tasks fetch failed", tasksError);
    } else {
      tasksByProject = (allTasks ?? []).reduce((acc, task) => {
        const existing = acc[task.project_id] ?? [];
        acc[task.project_id] = [
          ...existing,
          { id: task.id, title: task.title, completed: task.completed },
        ];
        return acc;
      }, {} as Record<string, { id: string; title: string; completed: boolean }[]>);
    }

    const { data: releasedPayouts, error: payoutsError } = await supabase
      .from("payouts")
      .select("project_id, amount")
      .in("project_id", projectIds)
      .eq("status", "released");

    if (payoutsError) {
      console.error("dashboard: payouts fetch failed", payoutsError);
    } else {
      releasedByProject = (releasedPayouts ?? []).reduce((acc, payout) => {
        acc[payout.project_id] = (acc[payout.project_id] ?? 0) + payout.amount;
        return acc;
      }, {} as Record<string, number>);
    }
  }

  const dashboardProjects = projects.map((project) => ({
    id: project.id,
    title: project.title,
    deposit_amount: project.deposit_amount,
    daily_payout: project.daily_payout,
    end_date: project.end_date,
    isOverdue: project.end_date < today,
    checkedInToday: checkedInProjectIds.has(project.id),
    tasks: tasksByProject[project.id] ?? [],
    remaining_balance:
      project.deposit_amount - (releasedByProject[project.id] ?? 0),
  }));

  const overdueProjects = dashboardProjects.filter((p) => p.isOverdue);
  const currentProjects = dashboardProjects.filter((p) => !p.isOverdue);

  return (
    <main className="min-h-screen bg-[#0A0A0A] px-6 py-12">
      <MissedDayModal />

      <div className="w-full max-w-sm mx-auto flex flex-col gap-10">

        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-[#F0EDEA]">
            {profile?.name
              ? `Welcome back, ${profile.name}`
              : "Welcome back"}
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

        {!profile?.stripe_account_id && (
          <SetupPayoutsBanner />
        )}

        {overdueProjects.length > 0 && (
          <div className="flex flex-col gap-3">
            {overdueProjects.map((project) => (
              <OverdueBanner
                key={project.id}
                projectId={project.id}
                projectTitle={project.title}
                currentEndDate={project.end_date}
              />
            ))}
          </div>
        )}

        {currentProjects.length > 0 ? (
          <ProjectSwitcher projects={currentProjects} />
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
