// ── IMPORTS ───────────────────────────────────────────────────────────────────
import Link from "next/link";
import { LEVEL_GROUPS } from "@/lib/xp/levels";

// ── TYPES ─────────────────────────────────────────────────────────────────────
type TierMeta = {
  unlock: string;
};

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const TIER_META: Record<string, TierMeta> = {
  Freshman:  { unlock: "Daily check-ins · AI verification" },
  Sophomore: { unlock: "Weekly reviews · XP multipliers" },
  Junior:    { unlock: "Coming soon" },
  Graduate:  { unlock: "Coming soon" },
  Builder:   { unlock: "Coming soon" },
  Mogul:     { unlock: "Coming soon" },
  Legend:    { unlock: "Coming soon" },
};

// ── PAGE ──────────────────────────────────────────────────────────────────────
export default function OnboardingPreviewPage({
  searchParams,
}: {
  searchParams: { projectId?: string };
}) {
  const projectId = searchParams.projectId ?? "";

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0A] px-6 py-16">
      <div className="w-full max-w-sm flex flex-col gap-10">

        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold text-[#F0EDEA] leading-tight">
            Your path.
          </h2>
          <p className="text-sm text-[#6B6B6B] leading-relaxed">
            You start as a Freshman. Every check-in moves you forward.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {LEVEL_GROUPS.map((group, index) => {
            const isCurrent = group.name === "Freshman";
            const meta = TIER_META[group.name];

            return (
              <div
                key={group.name}
                className={`flex flex-col gap-1 px-4 py-4 rounded-md border transition-colors ${
                  isCurrent
                    ? "border-[#C9A84C] bg-[#111111]"
                    : "border-[#1F1F1F] bg-[#0D0D0D] opacity-50"
                }`}
              >
                <div className="flex items-baseline justify-between">
                  <span
                    className={`text-sm font-semibold ${
                      isCurrent ? "text-[#C9A84C]" : "text-[#F0EDEA]"
                    }`}
                  >
                    {group.name}
                  </span>
                  <span className="text-xs text-[#6B6B6B]">
                    {group.maxLevel
                      ? `Lv ${group.minLevel}–${group.maxLevel}`
                      : `Lv ${group.minLevel}+`}
                  </span>
                </div>
                <p className="text-xs text-[#6B6B6B]">{meta.unlock}</p>
              </div>
            );
          })}
        </div>

        <Link
          href={`/check-in/${projectId}`}
          className="w-full py-4 bg-[#C9A84C] text-[#0A0A0A] font-semibold text-base rounded-md tracking-wide hover:bg-[#E5C97A] transition-colors text-center"
        >
          Begin
        </Link>

      </div>
    </main>
  );
}
