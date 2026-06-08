"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProjectSetupStore } from "@/lib/stores/projectSetupStore";

export default function GoodDayHardDayStep() {
  const router = useRouter();
  const setDayDescriptions = useProjectSetupStore(
    (state) => state.setDayDescriptions
  );

  const [goodDay, setGoodDay] = useState("");
  const [hardDay, setHardDay] = useState("");

  function handleContinue() {
    setDayDescriptions({
      good_day_description: goodDay,
      hard_day_description: hardDay,
    });

    router.push("/projects/new/review");
  }

  const canContinue = goodDay.trim().length > 0 && hardDay.trim().length > 0;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0A] px-6">
      <div className="w-full max-w-sm flex flex-col gap-8">

        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-[#F0EDEA]">
            Two more things.
          </h2>
          <p className="text-sm text-[#6B6B6B]">
            This is what the app will remember about you.
          </p>
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <span className="text-xs text-[#6B6B6B] tracking-wide uppercase">
              What does a good day look like for this?
            </span>
            <textarea
              value={goodDay}
              onChange={(e) => setGoodDay(e.target.value)}
              rows={3}
              placeholder="I sit down and just start. An hour goes by and I've made real progress."
              className="w-full px-4 py-3 bg-[#111111] border border-[#1F1F1F] rounded-md text-[#F0EDEA] placeholder-[#6B6B6B] text-sm resize-none focus:outline-none focus:border-[#C9A84C] transition-colors"
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs text-[#6B6B6B] tracking-wide uppercase">
              What does a hard day look like?
            </span>
            <textarea
              value={hardDay}
              onChange={(e) => setHardDay(e.target.value)}
              rows={3}
              placeholder="I open it, stare at it, and close it again."
              className="w-full px-4 py-3 bg-[#111111] border border-[#1F1F1F] rounded-md text-[#F0EDEA] placeholder-[#6B6B6B] text-sm resize-none focus:outline-none focus:border-[#C9A84C] transition-colors"
            />
          </div>
        </div>

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
