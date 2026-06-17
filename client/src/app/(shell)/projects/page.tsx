// ── IMPORTS ───────────────────────────────────────────────────────────────────
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getDateInTimezone } from "@/lib/date/getDateInTimezone";
import ProjectActions from "./_components/ProjectActions";

// ── HELPERS ───────────────────────────────────────────────────────────────────
function formatCents(cents: number): string {
  return `$${(cents / 100).toLocaleString()}`;
}

// ── PAGE ──────────────────────────────────────────────────────────────────────
// ProjectsPage — every project for the user, with check-in, history, and close actions
export default async function ProjectsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("timezone")
    .eq("id", user.id)
    .single();

  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("id, title, status, deposit_amount, daily_payout")
    .eq("user_id", user.id)
    .order("deposit_amount", { ascending: false });

  if (projectsError) {
    console.error("projects: fetch failed", projectsError);
  }

  const today = getDateInTimezone(new Date(), profile?.timezone ?? "UTC");

  const { data: todayCheckIns, error: checkInsError } = await supabase
    .from("check_ins")
    .select("project_id")
    .eq("user_id", user.id)
    .eq("check_in_date", today);

  if (checkInsError) {
    console.error("projects: today check_ins fetch failed", checkInsError);
  }

  const checkedInProjectIds = new Set(
    (todayCheckIns ?? []).map((checkIn) => checkIn.project_id)
  );

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#0A0A0A] px-6 py-12">
      <div className="w-full max-w-2xl mx-auto flex flex-col gap-8">

        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-[#F0EDEA]">
            Your projects
          </h1>
          <p className="text-sm text-[#6B6B6B]">
            Everything you&apos;ve put on the line.
          </p>
        </div>

        {(!projects || projects.length === 0) ? (
          <div className="flex flex-col gap-4 items-center text-center py-10">
            <p className="text-sm text-[#6B6B6B]">
              No projects yet. Time to put something on the line.
            </p>
            <Link
              href="/projects/new"
              className="w-full max-w-[200px] py-4 bg-[#C9A84C] text-[#0A0A0A] font-semibold text-base rounded-md tracking-wide text-center hover:bg-[#E5C97A] transition-colors"
            >
              Start a project
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {projects.map((project) => {
              const checkedInToday = checkedInProjectIds.has(project.id);
              const isActive = project.status === "active";

              return (
                <div
                  key={project.id}
                  className="flex flex-col gap-4 px-5 py-5 bg-[#111111] border border-[#1F1F1F] rounded-md"
                >
                  <div className="flex justify-between items-baseline">
                    <span className="text-lg font-semibold text-[#F0EDEA]">
                      {project.title}
                    </span>
                    <span className="text-xs text-[#6B6B6B] uppercase tracking-wide">
                      {project.status}
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-[#6B6B6B] uppercase tracking-wide">
                      Deposit
                    </span>
                    <span className="text-sm font-semibold text-[#C9A84C]">
                      {formatCents(project.deposit_amount)}
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-[#6B6B6B] uppercase tracking-wide">
                      Daily payout
                    </span>
                    <span className="text-sm font-semibold text-[#F0EDEA]">
                      {formatCents(project.daily_payout)}
                    </span>
                  </div>

                  <div className="flex gap-3">
                    {isActive && (
                      checkedInToday ? (
                        <span className="flex-1 text-center py-3 border border-[#1F1F1F] rounded-md text-sm text-[#2D6A4F] font-semibold">
                          Logged today
                        </span>
                      ) : (
                        <Link
                          href={`/check-in/${project.id}`}
                          className="flex-1 text-center py-3 bg-[#C9A84C] text-[#0A0A0A] font-semibold text-sm rounded-md hover:bg-[#E5C97A] transition-colors"
                        >
                          Drop receipt
                        </Link>
                      )
                    )}

                    <Link
                      href={`/projects/${project.id}/history`}
                      className="flex-1 text-center py-3 border border-[#1F1F1F] text-[#F0EDEA] font-semibold text-sm rounded-md hover:border-[#C9A84C] transition-colors"
                    >
                      History
                    </Link>
                  </div>

                  {isActive && (
                    <ProjectActions projectId={project.id} />
                  )}

                </div>
              );
            })}
          </div>
        )}

      </div>
    </main>
  );
}
