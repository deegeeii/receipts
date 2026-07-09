// ── IMPORTS ───────────────────────────────────────────────────────────────────
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SubscriptionActions from "./_components/SubscriptionActions";

// ── PAGE ──────────────────────────────────────────────────────────────────────
export default async function SubscriptionPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("users")
    .select("subscription_tier")
    .eq("id", user.id)
    .single();

  const tier = (profile?.subscription_tier ?? "standard") as "standard" | "pro";

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0A] px-6">
      <div className="w-full max-w-sm flex flex-col gap-8">

        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-[#F0EDEA]">
            Your plan
          </h2>
          <p className="text-sm text-[#6B6B6B]">
            {tier === "pro" ? "Pro — $20/mo" : "Standard — $10/mo"}
          </p>
        </div>

        <div className="flex flex-col gap-3 px-5 py-5 bg-[#111111] border border-[#1F1F1F] rounded-md">
          {tier === "standard" ? (
            <>
              <PlanRow label="Active projects" value="1" />
              <PlanRow label="Daily check-ins" value="Included" />
              <PlanRow label="AI verification" value="Included" />
              <PlanRow label="Multiple projects" locked />
              <PlanRow label="Advanced check-in modes" locked />
              <PlanRow label="Instant payouts" locked />
            </>
          ) : (
            <>
              <PlanRow label="Active projects" value="Unlimited (level-gated)" />
              <PlanRow label="Daily check-ins" value="Included" />
              <PlanRow label="AI verification" value="Included" />
              <PlanRow label="Advanced check-in modes" value="Level-gated" />
              <PlanRow label="Instant payouts" value="Included" />
            </>
          )}
        </div>

        <SubscriptionActions tier={tier} />

      </div>
    </main>
  );
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
function PlanRow({
  label,
  value,
  locked,
}: {
  label: string;
  value?: string;
  locked?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-[#6B6B6B] uppercase tracking-wide">
        {label}
      </span>
      {locked ? (
        <span className="text-xs text-[#3A3A3A]">Locked</span>
      ) : (
        <span className="text-sm font-semibold text-[#F0EDEA]">{value}</span>
      )}
    </div>
  );
}
