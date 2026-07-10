// ── IMPORTS ───────────────────────────────────────────────────────────────────
"use client";

import { useState, useEffect } from "react";

// ── TYPES ─────────────────────────────────────────────────────────────────────
type MissedDay = {
  id: string;
  project_id: string;
  missed_date: string;
  projects: { title: string };
};

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const CHARITIES = [
  { id: "uncf", name: "UNCF" },
  { id: "tmcf", name: "Thurgood Marshall College Fund" },
  { id: "hbcu", name: "HBCU Foundation" },
  { id: "mbk", name: "My Brother's Keeper Alliance" },
  { id: "polaris", name: "Polaris Project" },
  { id: "gems", name: "GEMS" },
];

// ── COMPONENT ─────────────────────────────────────────────────────────────────
export default function MissedDayModal() {

  // ── STATE ───────────────────────────────────────────────────────────────────
  const [missedDays, setMissedDays] = useState<MissedDay[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mode, setMode] = useState<"idle" | "donate">("idle");
  const [selectedCharity, setSelectedCharity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ── EFFECTS ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function fetchMissedDays() {
      const res = await fetch("/api/missed-days");
      if (!res.ok) return;
      const data = await res.json();
      setMissedDays(data.missed_days ?? []);
    }

    fetchMissedDays();
  }, []);

  // ── HANDLERS ────────────────────────────────────────────────────────────────
  async function handleResolve(resolution: "rollover" | "donated") {
    const current = missedDays[currentIndex];
    if (!current) return;

    if (resolution === "donated" && !selectedCharity) return;

    setLoading(true);
    setError("");

    const res = await fetch("/api/missed-days", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        missed_day_id: current.id,
        resolution,
        charity: resolution === "donated" ? selectedCharity : undefined,
      }),
    });

    if (!res.ok) {
      setError("Something went wrong. Try again.");
      setLoading(false);
      return;
    }

    setMode("idle");
    setSelectedCharity("");
    setLoading(false);

    if (currentIndex + 1 < missedDays.length) {
      setCurrentIndex((i) => i + 1);
    } else {
      setMissedDays([]);
    }
  }

  // ── RENDER ──────────────────────────────────────────────────────────────────
  const current = missedDays[currentIndex];

  if (!current) return null;

  const formattedDate = new Date(`${current.missed_date}T00:00:00Z`).toLocaleDateString(
    "en-US",
    { weekday: "long", month: "long", day: "numeric" }
  );

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-6">
      <div className="w-full max-w-sm bg-[#111111] border border-[#1F1F1F] rounded-md flex flex-col gap-6 px-6 py-8">

        <div className="flex flex-col gap-2">
          <p className="text-xs text-[#6B6B6B] uppercase tracking-wide">
            {current.projects.title}
          </p>
          <h2 className="text-xl font-bold text-[#F0EDEA]">
            You missed {formattedDate}.
          </h2>
          <p className="text-sm text-[#6B6B6B] leading-relaxed">
            That day&apos;s payout stays in your balance. What do you want to do with it?
          </p>
        </div>

        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}

        {mode === "idle" && (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => handleResolve("rollover")}
              disabled={loading}
              className="w-full py-4 bg-[#C9A84C] text-[#0A0A0A] font-semibold text-base rounded-md tracking-wide hover:bg-[#E5C97A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Keep it
            </button>
            <button
              onClick={() => setMode("donate")}
              disabled={loading}
              className="w-full py-4 border border-[#1F1F1F] text-[#6B6B6B] text-sm rounded-md hover:text-[#F0EDEA] hover:border-[#F0EDEA] disabled:opacity-40 transition-colors"
            >
              Donate it
            </button>
          </div>
        )}

        {mode === "donate" && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              {CHARITIES.map((charity) => (
                <button
                  key={charity.id}
                  onClick={() => setSelectedCharity(charity.id)}
                  className={`w-full px-4 py-3 rounded-md border text-left text-sm transition-colors ${
                    selectedCharity === charity.id
                      ? "border-[#C9A84C] text-[#F0EDEA]"
                      : "border-[#1F1F1F] text-[#6B6B6B] hover:border-[#C9A84C]/50"
                  }`}
                >
                  {charity.name}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleResolve("donated")}
                disabled={!selectedCharity || loading}
                className="flex-1 py-3 bg-[#C9A84C] text-[#0A0A0A] font-semibold text-sm rounded-md hover:bg-[#E5C97A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Saving..." : "Confirm"}
              </button>
              <button
                onClick={() => { setMode("idle"); setSelectedCharity(""); }}
                className="flex-1 py-3 border border-[#1F1F1F] text-[#6B6B6B] text-sm rounded-md hover:text-[#F0EDEA] transition-colors"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {missedDays.length > 1 && (
          <p className="text-xs text-[#6B6B6B] text-center">
            {currentIndex + 1} of {missedDays.length} missed days
          </p>
        )}

      </div>
    </div>
  );
}
