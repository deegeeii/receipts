"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProjectSetupStore } from "@/lib/stores/projectSetupStore";

const DAYS = [
  { index: 0, label: "Sun" },
  { index: 1, label: "Mon" },
  { index: 2, label: "Tue" },
  { index: 3, label: "Wed" },
  { index: 4, label: "Thu" },
  { index: 5, label: "Fri" },
  { index: 6, label: "Sat" },
];

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

// WorkWeekStep — Step 3 of project creation: choose your 5 work days (sets daily_payout)
export default function WorkWeekStep() {
  const router = useRouter();
  const setWorkDays = useProjectSetupStore((state) => state.setWorkDays);
  const deposit_amount = useProjectSetupStore((state) => state.deposit_amount);
  const duration = useProjectSetupStore((state) => state.duration);
  const initialWorkDays = useProjectSetupStore((state) => state.work_days);

  // selected — the 5 chosen work day indices (initialized from store default Mon-Fri)
  const [selected, setSelected] = useState<number[]>(initialWorkDays);

  function toggleDay(index: number) {
    setSelected((prev) => {
      if (prev.includes(index)) {
        return prev.filter((d) => d !== index);
      }
      if (prev.length >= 5) return prev;
      return [...prev, index];
    });
  }

  function handleContinue() {
    setWorkDays(selected);
    router.push("/projects/new/quiz");
  }

  const canContinue = selected.length === 5;

  const totalWorkDays = duration === "week" ? 5 : 20;
  const previewPayout =
    deposit_amount && canContinue
      ? formatCents(Math.round(deposit_amount / totalWorkDays))
      : null;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0A] px-6">
      <div className="w-full max-w-sm flex flex-col gap-8">

        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-[#F0EDEA]">
            Your work week.
          </h2>
          <p className="text-sm text-[#6B6B6B]">
            Pick your 5 days. The rest are yours.
          </p>
        </div>

        {/* day toggles — exactly 5 must be selected before continuing */}
        <div className="grid grid-cols-7 gap-2">
          {DAYS.map((day) => {
            const isSelected = selected.includes(day.index);
            const isDisabled = !isSelected && selected.length >= 5;

            return (
              <button
                key={day.index}
                onClick={() => toggleDay(day.index)}
                disabled={isDisabled}
                className={`py-3 rounded-md border text-xs font-semibold transition-colors ${
                  isSelected
                    ? "border-[#C9A84C] bg-[#C9A84C] text-[#0A0A0A]"
                    : isDisabled
                    ? "border-[#1F1F1F] text-[#3A3A3A] cursor-not-allowed"
                    : "border-[#1F1F1F] text-[#6B6B6B] hover:border-[#C9A84C]/50"
                }`}
              >
                {day.label}
              </button>
            );
          })}
        </div>

        {previewPayout && (
          <p className="text-sm text-center text-[#6B6B6B]">
            You&apos;ll earn{" "}
            <span className="text-[#C9A84C] font-semibold">
              {previewPayout}
            </span>{" "}
            per day you show up.
          </p>
        )}

        <button
          onClick={handleContinue}
          disabled={!canContinue}
          className="w-full py-4 bg-[#C9A84C] text-[#0A0A0A] font-semibold text-base rounded-md tracking-wide hover:bg-[#E5C97A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Continue
        </button>

      </div>
    </main>
  );
}
