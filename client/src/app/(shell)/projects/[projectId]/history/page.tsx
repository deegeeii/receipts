import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

type ProjectHistoryPageProps = {
  params: Promise<{ projectId: string }>;
};

// ProjectHistoryPage — the receipt ledger: every check-in for a project, newest first
export default async function ProjectHistoryPage({
  params,
}: ProjectHistoryPageProps) {
  const { projectId } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: project } = await supabase
    .from("projects")
    .select("title")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!project) {
    console.error("history: project not found", { projectId, user_id: user.id });
    redirect("/dashboard");
  }

  const { data: checkIns, error: checkInsError } = await supabase
    .from("check_ins")
    .select("id, check_in_date, receipt_text, ai_question, ai_response, xp_earned")
    .eq("project_id", projectId)
    .order("check_in_date", { ascending: false });

  if (checkInsError) {
    console.error("history: check_ins fetch failed", checkInsError);
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] px-6 py-12">
      <div className="w-full max-w-2xl mx-auto flex flex-col gap-8">

        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-[#F0EDEA]">
            {project.title}
          </h1>
          <p className="text-sm text-[#6B6B6B]">
            Receipt history
          </p>
        </div>

        {(!checkIns || checkIns.length === 0) ? (
          <p className="text-sm text-[#6B6B6B] text-center py-10">
            No receipts yet. Check in to start your ledger.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {checkIns.map((checkIn) => (
              <div
                key={checkIn.id}
                className="flex flex-col gap-3 px-5 py-5 bg-[#111111] border border-[#1F1F1F] rounded-md"
              >
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-semibold text-[#F0EDEA]">
                    {formatDate(checkIn.check_in_date)}
                  </span>
                  <span className="text-xs text-[#C9A84C] font-semibold">
                    +{checkIn.xp_earned} XP
                  </span>
                </div>

                <p className="text-sm text-[#F0EDEA] leading-relaxed">
                  {checkIn.receipt_text}
                </p>

                <div className="flex flex-col gap-1 pt-2 border-t border-[#1F1F1F]">
                  <span className="text-xs text-[#6B6B6B] uppercase tracking-wide">
                    {checkIn.ai_question}
                  </span>
                  <p className="text-sm text-[#F0EDEA] leading-relaxed">
                    {checkIn.ai_response}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}
