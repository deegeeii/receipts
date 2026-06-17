import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

// IdeationPage — hub for starting new projects or expanding existing roadmaps
export default async function IdeationPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("id, title, status")
    .eq("user_id", user.id)
    .order("deposit_amount", { ascending: false });

  if (projectsError) {
    console.error("ideation: projects fetch failed", projectsError);
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] px-6 py-12">
      <div className="w-full max-w-2xl mx-auto flex flex-col gap-8">

        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-[#F0EDEA]">
            Ideation
          </h1>
          <p className="text-sm text-[#6B6B6B]">
            Start something new, or build out the roadmap for what you&apos;ve already got going.
          </p>
        </div>

        <Link
          href="/projects/new"
          className="w-full py-4 bg-[#C9A84C] text-[#0A0A0A] font-semibold text-base rounded-md tracking-wide text-center hover:bg-[#E5C97A] transition-colors"
        >
          Start a new project
        </Link>

        <div className="flex flex-col gap-3">
          <span className="text-xs text-[#6B6B6B] uppercase tracking-wide">
            Build out a roadmap
          </span>

          {(!projects || projects.length === 0) ? (
            <p className="text-sm text-[#6B6B6B]">
              No projects yet.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/ideation/${project.id}`}
                  className="flex justify-between items-center px-5 py-4 bg-[#111111] border border-[#1F1F1F] rounded-md hover:border-[#C9A84C] transition-colors"
                >
                  <span className="text-sm font-semibold text-[#F0EDEA]">
                    {project.title}
                  </span>
                  <span className="text-xs text-[#6B6B6B] uppercase tracking-wide">
                    {project.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
