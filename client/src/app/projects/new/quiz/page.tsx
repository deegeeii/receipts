"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProjectSetupStore } from "@/lib/stores/projectSetupStore";

const OBSTACLE_OPTIONS = [
  { value: "bursts_and_crash", label: "I work in bursts and crash" },
  { value: "start_dont_finish", label: "I start but don't finish" },
  { value: "lose_momentum", label: "I lose momentum after a few days" },
  { value: "dont_know_where_to_start", label: "I don't know where to start" },
  { value: "get_distracted", label: "I get distracted easily" },
];

const WORK_STYLE_OPTIONS = [
  { value: "daily_steps", label: "I take small steps every day" },
  { value: "big_push", label: "I go all-in, then crash" },
  { value: "deadline_driven", label: "Deadlines force me to move" },
  { value: "needs_watching", label: "I need someone checking on me" },
] as const;

// PersonalityQuizStep — Step 3 of project creation: Q4 (obstacles) + Q5 (work style)
// These map directly to users.obstacle_patterns and users.work_style — asked once, permanent
export default function PersonalityQuizStep() {
  const router = useRouter();
  const setQuiz = useProjectSetupStore((state) => state.setQuiz);

  // obstaclePatterns — multi-select (Q4), workStyle — single-select (Q5)
  const [obstaclePatterns, setObstaclePatterns] = useState<string[]>([]);
  const [workStyle, setWorkStyle] = useState<
    (typeof WORK_STYLE_OPTIONS)[number]["value"] | null
  >(null);

  function toggleObstacle(value: string) {
    setObstaclePatterns((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    );
  }

  function handleContinue() {
    if (!workStyle) return;

    setQuiz({
      work_style: workStyle,
      obstacle_patterns: obstaclePatterns,
    });

    router.push("/projects/new/days");
  }

  const canContinue = obstaclePatterns.length > 0 && workStyle !== null;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0A] px-6 py-12">
      <div className="w-full max-w-sm flex flex-col gap-10">

        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-[#F0EDEA]">
            How do you actually work?
          </h2>
          <p className="text-sm text-[#6B6B6B]">
            This shapes how the app shows up for you. Just once.
          </p>
        </div>

        {/* Q4 — obstacle patterns, multi-select group */}
        <fieldset className="flex flex-col gap-3">
          <legend className="text-xs text-[#6B6B6B] tracking-wide uppercase">
            What gets in your way? (pick any)
          </legend>
          {OBSTACLE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => toggleObstacle(option.value)}
              className={`w-full px-4 py-3 rounded-md border text-left text-sm transition-colors ${
                obstaclePatterns.includes(option.value)
                  ? "border-[#C9A84C] bg-[#111111] text-[#F0EDEA]"
                  : "border-[#1F1F1F] bg-[#111111] text-[#6B6B6B] hover:border-[#C9A84C]/50"
              }`}
            >
              {option.label}
            </button>
          ))}
        </fieldset>

        {/* Q5 — work style, single-select group */}
        <fieldset className="flex flex-col gap-3">
          <legend className="text-xs text-[#6B6B6B] tracking-wide uppercase">
            How do you move forward?
          </legend>
          {WORK_STYLE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setWorkStyle(option.value)}
              className={`w-full px-4 py-3 rounded-md border text-left text-sm transition-colors ${
                workStyle === option.value
                  ? "border-[#C9A84C] bg-[#111111] text-[#F0EDEA]"
                  : "border-[#1F1F1F] bg-[#111111] text-[#6B6B6B] hover:border-[#C9A84C]/50"
              }`}
            >
              {option.label}
            </button>
          ))}
        </fieldset>

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
