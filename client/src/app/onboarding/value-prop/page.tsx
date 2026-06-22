// ── IMPORTS ───────────────────────────────────────────────────────────────────
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const SLIDES = [
  {
    heading: "You invest the money.",
    subheading: "You invest the time.",
    body: "You reap the reward.",
  },
  {
    heading: "Receipts prove your work.",
    subheading: null,
    body: "Every day you show up, you earn back what you put in. Every day you don't — it stays on the line.",
  },
  {
    heading: "Let's set up your first project.",
    subheading: null,
    body: "Tell us what you're working on. Put something on the line. Then show up.",
  },
];

// ── PAGE ──────────────────────────────────────────────────────────────────────
// OnboardingValuePropPage — three-slide value proposition carousel
export default function OnboardingValuePropPage() {

  // ── STATE ───────────────────────────────────────────────────────────────────
  const router = useRouter();
  const [current, setCurrent] = useState(0);

  const slide = SLIDES[current];
  const isLast = current === SLIDES.length - 1;

  // ── HANDLERS ──────────────────────────────────────────────────────────────
  function handleNext() {
    if (isLast) {
      router.push("/onboarding/village");
    } else {
      setCurrent((prev) => prev + 1);
    }
  }

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0A] px-6">
      <div className="w-full max-w-sm flex flex-col gap-12">

        <div className="flex flex-col gap-4 min-h-[160px] justify-center">
          <h2 className="text-3xl font-bold text-[#F0EDEA] leading-tight">
            {slide.heading}
            {slide.subheading && (
              <>
                <br />
                {slide.subheading}
                <br />
                <span className="text-[#C9A84C]">{slide.body}</span>
              </>
            )}
          </h2>

          {!slide.subheading && (
            <p className="text-sm text-[#6B6B6B] leading-relaxed">
              {slide.body}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex gap-2 justify-center">
            {SLIDES.map((_, index) => (
              <div
                key={index}
                className={`h-1 rounded-full transition-all duration-300 ${
                  index === current
                    ? "w-8 bg-[#C9A84C]"
                    : "w-2 bg-[#1F1F1F]"
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="w-full py-4 bg-[#C9A84C] text-[#0A0A0A] font-semibold text-base rounded-md tracking-wide hover:bg-[#E5C97A] transition-colors"
          >
            {isLast ? "Let's go" : "Next"}
          </button>
        </div>

      </div>
    </main>
  );
}
