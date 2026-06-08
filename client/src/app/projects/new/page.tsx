"use client";

import { useRouter } from "next/navigation";
import { useProjectSetupStore } from "@/lib/stores/projectSetupStore";

const TIERS = [
  { amount: 5000, label: "$50", multiplier: "1x" },
  { amount: 10000, label: "$100", multiplier: "1.5x" },
  { amount: 25000, label: "$250", multiplier: "2.5x" },
  { amount: 50000, label: "$500", multiplier: "3.5x" },
  { amount: 100000, label: "$1,000", multiplier: "5x" },
];

export default function NewProjectStepOne() {
  const router = useRouter();
  const setDeposit = useProjectSetupStore((state) => state.setDeposit);
  const deposit_amount = useProjectSetupStore((state) => state.deposit_amount);

  function handleSelect(amount: number) {
    setDeposit(amount);
    router.push("/projects/new/basics");
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0A] px-6">
      <div className="w-full max-w-sm flex flex-col gap-8">

        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-[#F0EDEA]">
            What&apos;s it worth to you?
          </h2>
          <p className="text-sm text-[#6B6B6B]">
            Higher stakes earn faster XP.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {TIERS.map((tier) => (
            <button
              key={tier.amount}
              onClick={() => handleSelect(tier.amount)}
              className={`w-full flex items-center justify-between px-5 py-4 rounded-md border text-left transition-colors ${
                deposit_amount === tier.amount
                  ? "border-[#C9A84C] bg-[#111111]"
                  : "border-[#1F1F1F] bg-[#111111] hover:border-[#C9A84C]/50"
              }`}
            >
              <span className="text-lg font-semibold text-[#F0EDEA]">
                {tier.label}
              </span>
              <span className="text-xs text-[#6B6B6B] tracking-wide">
                {tier.multiplier} XP
              </span>
            </button>
          ))}
        </div>

      </div>
    </main>
  );
}
