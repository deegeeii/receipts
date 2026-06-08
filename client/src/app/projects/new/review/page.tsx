"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProjectSetupStore } from "@/lib/stores/projectSetupStore";

function formatCents(cents: number): string {
  return `$${(cents / 100).toLocaleString()}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function ReviewAndCommitStep() {
  const router = useRouter();
  const setup = useProjectSetupStore((state) => state);
  const reset = useProjectSetupStore((state) => state.reset);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setSubmitting(true);
    setError(null);

    const response = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: setup.title,
        description: setup.description,
        deposit_amount: setup.deposit_amount,
        daily_payout: setup.daily_payout,
        start_date: setup.start_date,
        end_date: setup.end_date,
        work_style: setup.work_style,
        obstacle_patterns: setup.obstacle_patterns,
        good_day_description: setup.good_day_description,
        hard_day_description: setup.hard_day_description,
      }),
    });

    if (!response.ok) {
      setError("Something went wrong. Try again.");
      setSubmitting(false);
      return;
    }

    reset();
    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0A] px-6 py-12">
      <div className="w-full max-w-sm flex flex-col gap-8">

        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-[#F0EDEA]">
            Lock it in.
          </h2>
          <p className="text-sm text-[#6B6B6B]">
            Once you confirm, the deposit is on.
          </p>
        </div>

        <div className="flex flex-col gap-4 px-5 py-5 bg-[#111111] border border-[#1F1F1F] rounded-md">
          <div className="flex justify-between items-baseline">
            <span className="text-xs text-[#6B6B6B] uppercase tracking-wide">
              Project
            </span>
            <span className="text-sm font-semibold text-[#F0EDEA]">
              {setup.title}
            </span>
          </div>

          <div className="flex justify-between items-baseline">
            <span className="text-xs text-[#6B6B6B] uppercase tracking-wide">
              Deposit
            </span>
            <span className="text-sm font-semibold text-[#C9A84C]">
              {setup.deposit_amount !== null && formatCents(setup.deposit_amount)}
            </span>
          </div>

          <div className="flex justify-between items-baseline">
            <span className="text-xs text-[#6B6B6B] uppercase tracking-wide">
              Daily payout
            </span>
            <span className="text-sm font-semibold text-[#F0EDEA]">
              {setup.daily_payout !== null && formatCents(setup.daily_payout)}
            </span>
          </div>

          <div className="flex justify-between items-baseline">
            <span className="text-xs text-[#6B6B6B] uppercase tracking-wide">
              Runs
            </span>
            <span className="text-sm font-semibold text-[#F0EDEA]">
              {setup.start_date && formatDate(setup.start_date)} —{" "}
              {setup.end_date && formatDate(setup.end_date)}
            </span>
          </div>
        </div>

        {error && (
          <p className="text-sm text-[#7B2D2D] text-center">{error}</p>
        )}

        <button
          onClick={handleConfirm}
          disabled={submitting}
          className="w-full py-4 bg-[#C9A84C] text-[#0A0A0A] font-semibold text-base rounded-md tracking-wide hover:bg-[#E5C97A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? "Locking it in..." : "I'm in. Lock it in."}
        </button>

      </div>
    </main>
  );
}
