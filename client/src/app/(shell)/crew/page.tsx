// ── IMPORTS ───────────────────────────────────────────────────────────────────
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CrewWorkspace from "./_components/CrewWorkspace";

// ── PAGE ──────────────────────────────────────────────────────────────────────
export default async function CrewPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("invite_code, name, level, current_streak")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("crew: profile fetch failed", profileError);
  }

  const { data: buddies, error: buddiesError } = await supabase.rpc(
    "get_my_buddies"
  );

  if (buddiesError) {
    console.error("crew: buddies fetch failed", buddiesError);
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] px-6 py-12">
      <div className="w-full max-w-2xl mx-auto flex flex-col gap-8">

        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-[#F0EDEA]">
            Crew
          </h1>
          <p className="text-sm text-[#6B6B6B]">
            Success thrives in the village. Share your code, add a buddy.
          </p>
        </div>

        <CrewWorkspace
          inviteCode={profile?.invite_code ?? ""}
          initialBuddies={buddies ?? []}
          currentUser={{
            id: user.id,
            name: profile?.name ?? null,
            level: profile?.level ?? 1,
            current_streak: profile?.current_streak ?? 0,
          }}
        />

      </div>
    </main>
  );
}
