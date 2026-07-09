// ── IMPORTS ───────────────────────────────────────────────────────────────────
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import DepositSelector from "./_components/DepositSelector";

// ── PAGE ──────────────────────────────────────────────────────────────────────
export default async function NewProjectPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("users")
    .select("subscription_tier, level")
    .eq("id", user.id)
    .single();

  const tier = profile?.subscription_tier ?? "standard";
  const level = profile?.level ?? 1;
  const isJuniorOrAbove = level >= 16;

  const { count } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "active");

  const activeCount = count ?? 0;

  if (activeCount >= 1) {
    if (tier === "standard") {
      return (
        <main className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0A] px-6">
          <div className="w-full max-w-sm flex flex-col gap-8">

            <div className="flex flex-col gap-3">
              <h2 className="text-2xl font-bold text-[#F0EDEA]">
                You&apos;re at your project limit.
              </h2>
              <p className="text-sm text-[#6B6B6B] leading-relaxed">
                Standard plan includes 1 active project. Upgrade to Pro to run
                multiple projects at once.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Link
                href="/settings/subscription"
                className="w-full py-4 bg-[#C9A84C] text-[#0A0A0A] font-semibold text-base rounded-md tracking-wide hover:bg-[#E5C97A] transition-colors text-center"
              >
                Upgrade to Pro — $20/mo
              </Link>
              <Link
                href="/dashboard"
                className="w-full py-4 text-[#6B6B6B] text-sm hover:text-[#F0EDEA] transition-colors text-center"
              >
                Back to dashboard
              </Link>
            </div>

          </div>
        </main>
      );
    }

    if (tier === "pro" && !isJuniorOrAbove) {
      return (
        <main className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0A] px-6">
          <div className="w-full max-w-sm flex flex-col gap-8">

            <div className="flex flex-col gap-3">
              <h2 className="text-2xl font-bold text-[#F0EDEA]">
                Keep going.
              </h2>
              <p className="text-sm text-[#6B6B6B] leading-relaxed">
                Multiple projects unlock at Junior (Level 16). You&apos;re at
                Level {level} — keep checking in to get there.
              </p>
            </div>

            <Link
              href="/dashboard"
              className="w-full py-4 text-[#6B6B6B] text-sm hover:text-[#F0EDEA] transition-colors text-center"
            >
              Back to dashboard
            </Link>

          </div>
        </main>
      );
    }
  }

  return <DepositSelector />;
}
