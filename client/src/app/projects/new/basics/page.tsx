"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProjectSetupStore } from "@/lib/stores/projectSetupStore";

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

// ProjectBasicsStep — Step 2 of project creation: title, description, duration
export default function ProjectBasicsStep() {
  const router = useRouter();
  const setBasics = useProjectSetupStore((state) => state.setBasics);

  // Local form state — committed to the project setup store on continue
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState<"week" | "month">("week");

  function handleContinue() {
    const start_date = new Date().toISOString().slice(0, 10);
    const end_date = addDays(start_date, duration === "week" ? 7 : 28);

    setBasics({
      title,
      description,
      start_date,
      end_date,
      duration,
    });

    router.push("/projects/new/workweek");
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
          {/* Title field */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="title"
              className="text-xs text-[#6B6B6B] uppercase tracking-wide"
            >
              Project title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Project title"
              className="w-full px-4 py-3 bg-[#111111] border border-[#1F1F1F] rounded-md text-[#F0EDEA] placeholder-[#6B6B6B] text-sm focus:outline-none focus:border-[#C9A84C] transition-colors"
            />
          </div>

          {/* Description field */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="description"
              className="text-xs text-[#6B6B6B] uppercase tracking-wide"
            >
              What does done look like?
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does done look like?"
              rows={3}
              className="w-full px-4 py-3 bg-[#111111] border border-[#1F1F1F] rounded-md text-[#F0EDEA] placeholder-[#6B6B6B] text-sm resize-none focus:outline-none focus:border-[#C9A84C] transition-colors"
            />
          </div>

          {/* Duration selector — sets start_date/end_date on continue */}
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
          disabled={!title.trim() || !description.trim()}
          className="w-full py-4 bg-[#C9A84C] text-[#0A0A0A] font-semibold text-base rounded-md tracking-wide hover:bg-[#E5C97A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Continue
        </button>


      </div>
    </main>
  );
}
