import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { getDateInTimezone } from "@/lib/date/getDateInTimezone";
import { getCheckInMode } from "@/lib/checkIn/getCheckInMode";
import CheckInFlow from "./_components/CheckInFlow";

type PageParams = {
  params: Promise<{ projectId: string }>;
};

// CheckInPage — determines today's check-in mode and renders the flow
export default async function CheckInPage({ params }: PageParams) {
  const { projectId } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, title, work_days, start_date, last_weekly_review_date")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (projectError || !project) {
    console.error("check-in: project not found", projectError);
    notFound();
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("level, timezone")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("check-in: profile fetch failed", profileError);
  }

  const today = getDateInTimezone(new Date(), profile?.timezone ?? "UTC");
  const workDays: number[] = project.work_days ?? [1, 2, 3, 4, 5];

  const mode = getCheckInMode(
    profile?.level ?? 1,
    today,
    workDays,
    project.last_weekly_review_date ?? null,
    project.start_date
  );

  return (
    <CheckInFlow
      projectId={project.id}
      projectTitle={project.title}
      mode={mode}
    />
  );
}
