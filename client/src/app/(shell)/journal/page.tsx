import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import JournalWorkspace from "./_components/JournalWorkspace";

type JournalEntry = {
  id: string;
  project_id: string;
  entry_text: string;
  ai_response: string | null;
  created_at: string;
};

// JournalPage — per-project journal entries with AI reinforcement
export default async function JournalPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("id, title")
    .eq("user_id", user.id)
    .order("deposit_amount", { ascending: false });

  if (projectsError) {
    console.error("journal: projects fetch failed", projectsError);
  }

  const { data: entries, error: entriesError } = await supabase
    .from("journal_entries")
    .select("id, project_id, entry_text, ai_response, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (entriesError) {
    console.error("journal: entries fetch failed", entriesError);
  }

  const entriesByProject: Record<string, JournalEntry[]> = {};

  for (const entry of entries ?? []) {
    const existing = entriesByProject[entry.project_id] ?? [];
    entriesByProject[entry.project_id] = [...existing, entry];
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] px-6 py-12">
      <div className="w-full max-w-2xl mx-auto flex flex-col gap-8">

        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-[#F0EDEA]">
            Journal
          </h1>
          <p className="text-sm text-[#6B6B6B]">
            Reflect on a tough or exceptional week. The AI reads it and responds.
          </p>
        </div>

        {(!projects || projects.length === 0) ? (
          <p className="text-sm text-[#6B6B6B]">
            No projects yet. Start one to begin journaling.
          </p>
        ) : (
          <JournalWorkspace
            projects={projects}
            entriesByProject={entriesByProject}
          />
        )}

      </div>
    </main>
  );
}
