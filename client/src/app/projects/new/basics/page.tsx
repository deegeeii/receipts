"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProjectSetupStore } from "@/lib/stores/projectSetupStore";

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export default function ProjectBasicsStep() {
  const router = useRouter();
  const setBasics = useProjectSetupStore((state) => state.setBasics);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState<"week" | "month">("week");

  function handleContinue() {
    const start_date = new Date().toISOString().slice(0, 10);
    const end_date = addDays(start_date, duration === "week" ? 7 : 30);

    setBasics({
      title,
      description,
      start_date,
      end_date,
    });

    router.push("/projects/new/quiz");
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0A] px-6">
      <div className="w-full max-w-sm flex flex-col gap-8">

        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-[#F0EDEA]">
            What are you working on?
          </h2>
          <p className="text-sm text-[#6B6B6B]">
            Name it. Make it real.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Project title"
            className="w-full px-4 py-3 bg-[#111111] border border-[#1F1F1F] rounded-md text-[#F0EDEA] placeholder-[#6B6B6B] text-sm focus:outline-none focus:border-[#C9A84C] transition-colors"
          />

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does done look like?"
            rows={3}
            className="w-full px-4 py-3 bg-[#111111] border border-[#1F1F1F] rounded-md text-[#F0EDEA] placeholder-[#6B6B6B] text-sm resize-none focus:outline-none focus:border-[#C9A84C] transition-colors"
          />

          <div className="flex flex-col gap-2">
            <span className="text-xs text-[#6B6B6B] tracking-wide uppercase">
              Duration
            </span>
            <div className="flex gap-3">
              <button
                onClick={() => setDuration("week")}
                className={`flex-1 py-3 rounded-md border text-sm font-semibold transition-colors ${
                  duration === "week"
                    ? "border-[#C9A84C] bg-[#111111] text-[#F0EDEA]"
                    : "border-[#1F1F1F] bg-[#111111] text-[#6B6B6B] hover:border-[#C9A84C]/50"
                }`}
              >
                One week
              </button>
              <button
                onClick={() => setDuration("month")}
                className={`flex-1 py-3 rounded-md border text-sm font-semibold transition-colors ${
                  duration === "month"
                    ? "border-[#C9A84C] bg-[#111111] text-[#F0EDEA]"
                    : "border-[#1F1F1F] bg-[#111111] text-[#6B6B6B] hover:border-[#C9A84C]/50"
                }`}
              >
                One month
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={handleContinue}
          disabled={!title.trim()}
          className="w-full py-4 bg-[#C9A84C] text-[#0A0A0A] font-semibold text-base rounded-md tracking-wide hover:bg-[#E5C97A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Continue
        </button>

      </div>
    </main>
  );
}
