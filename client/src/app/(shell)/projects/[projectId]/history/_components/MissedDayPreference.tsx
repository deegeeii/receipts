// ── IMPORTS ───────────────────────────────────────────────────────────────────
"use client";

import { useState } from "react";

// ── TYPES ─────────────────────────────────────────────────────────────────────
type Props = {
  projectId: string;
  initialPreference: string | null;
  initialCharity: string | null;
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
export default function MissedDayPreference({
  projectId,
  initialPreference,
  initialCharity,
}: Props) {

  // ── STATE ───────────────────────────────────────────────────────────────────
  const [preference, setPreference] = useState(initialPreference);
  const [charity, setCharity] = useState(initialCharity);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // ── HANDLERS ────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (preference === "donated" && !charity) return;

    setLoading(true);
    setSaved(false);
    setError("");

    const res = await fetch(`/api/projects/${projectId}/preference`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        missed_day_preference: preference,
        default_charity: charity,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Failed to save. Try again.");
      setLoading(false);
      return;
    }

    setSaved(true);
    setLoading(false);
  }

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4 px-5 py-5 bg-[#111111] border border-[#1F1F1F] rounded-md">

      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-[#F0EDEA]">
          Missed day default
        </p>
        <p className="text-xs text-[#6B6B6B]">
          Set a permanent preference so you don&apos;t get asked each time.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => { setPreference("rollover"); setCharity(null); setSaved(false); }}
          className={`flex-1 py-3 rounded-md border text-sm font-semibold transition-colors ${
            preference === "rollover"
              ? "border-[#C9A84C] text-[#C9A84C]"
              : "border-[#1F1F1F] text-[#6B6B6B] hover:border-[#C9A84C]/50"
          }`}
        >
          Always keep it
        </button>
        <button
          onClick={() => { setPreference("donated"); setSaved(false); }}
          className={`flex-1 py-3 rounded-md border text-sm font-semibold transition-colors ${
            preference === "donated"
              ? "border-[#C9A84C] text-[#C9A84C]"
              : "border-[#1F1F1F] text-[#6B6B6B] hover:border-[#C9A84C]/50"
          }`}
        >
          Always donate
        </button>
      </div>

      {preference === "donated" && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-[#6B6B6B] uppercase tracking-wide">
            Default charity
          </p>
          {CHARITIES.map((c) => (
            <button
              key={c.id}
              onClick={() => { setCharity(c.id); setSaved(false); }}
              className={`w-full px-4 py-3 rounded-md border text-left text-sm transition-colors ${
                charity === c.id
                  ? "border-[#C9A84C] text-[#F0EDEA]"
                  : "border-[#1F1F1F] text-[#6B6B6B] hover:border-[#C9A84C]/50"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      <button
        onClick={handleSave}
        disabled={loading || !preference || (preference === "donated" && !charity)}
        className="w-full py-3 bg-[#C9A84C] text-[#0A0A0A] font-semibold text-sm rounded-md hover:bg-[#E5C97A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Saving..." : saved ? "Saved" : "Save preference"}
      </button>

      {preference && (
        <button
          onClick={() => { setPreference(null); setCharity(null); setSaved(false); }}
          className="text-xs text-[#6B6B6B] hover:text-[#F0EDEA] transition-colors text-center"
        >
          Clear preference
        </button>
      )}

    </div>
  );
}
