// ── IMPORTS ───────────────────────────────────────────────────────────────────
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// ── PAGE ──────────────────────────────────────────────────────────────────────
// OnboardingVillagePage — Village/Supporter ask before first project setup
export default function OnboardingVillagePage() {

  // ── STATE ───────────────────────────────────────────────────────────────────
  const router = useRouter();
  const [email, setEmail] = useState("");

  // ── HANDLERS ──────────────────────────────────────────────────────────────
  function handleContinue() {
    router.push("/projects/new");
  }

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0A] px-6">
      <div className="w-full max-w-sm flex flex-col gap-10">

        <div className="flex flex-col gap-3">
          <h2 className="text-3xl font-bold text-[#F0EDEA] leading-tight">
            Success thrives in the village.
          </h2>
          <p className="text-sm text-[#6B6B6B] leading-relaxed">
            Invite someone who wants to see you win — a friend, a mentor, 
            someone who will ask you how it&apos;s going. You don&apos;t have 
            to do this alone.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <label
            htmlFor="supporter-email"
            className="text-xs text-[#6B6B6B] uppercase tracking-wide"
          >
            Their email
          </label>
          <input
            id="supporter-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="someone@example.com"
            className="w-full px-4 py-3 bg-[#111111] border border-[#1F1F1F] rounded-md text-[#F0EDEA] placeholder-[#6B6B6B] text-sm focus:outline-none focus:border-[#C9A84C] transition-colors"
          />
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleContinue}
            disabled={email.trim().length === 0}
            className="w-full py-4 bg-[#C9A84C] text-[#0A0A0A] font-semibold text-base rounded-md tracking-wide hover:bg-[#E5C97A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Invite them
          </button>

          <button
            onClick={handleContinue}
            className="w-full py-4 text-[#6B6B6B] text-sm hover:text-[#F0EDEA] transition-colors"
          >
            I&apos;ll do this alone for now
          </button>
        </div>

      </div>
    </main>
  );
}
