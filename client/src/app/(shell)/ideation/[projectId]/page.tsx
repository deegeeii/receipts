import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import IdeationWorkspace from "./_components/IdeationWorkspace";

type PageParams = {
  params: Promise<{ projectId: string }>;
};

// IdeationWorkspacePage — roadmap-building workspace for a single project
export default async function IdeationWorkspacePage({ params }: PageParams) {
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
    .select("id, title")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (projectError || !project) {
    console.error("ideation workspace: project not found", projectError);
    notFound();
  }

  const { data: tasks, error: tasksError } = await supabase
    .from("project_tasks")
    .select("id, title, completed")
    .eq("project_id", projectId)
    .order("position", { ascending: true });

  if (tasksError) {
    console.error("ideation workspace: tasks fetch failed", tasksError);
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] px-6 py-12">
      <div className="w-full max-w-2xl mx-auto flex flex-col gap-8">

        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-[#F0EDEA]">
            {project.title}
          </h1>
          <p className="text-sm text-[#6B6B6B]">
            Build out the roadmap — add your own steps or get AI suggestions.
          </p>
        </div>

        <IdeationWorkspace
          projectId={project.id}
          initialTasks={tasks ?? []}
        />

      </div>
    </main>
  );
}
