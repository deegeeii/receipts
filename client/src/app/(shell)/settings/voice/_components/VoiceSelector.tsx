"use client";

// ── IMPORTS ───────────────────────────────────────────────────────────────────
import { useState } from "react";

// ── TYPES ─────────────────────────────────────────────────────────────────────
type Props = {
  level: number;
  streak: number;
  currentVoice: string;
};

type VoiceConfig = {
  id: string;
  name: string;
  description: string;
  unlockLabel: string;
  isUnlocked: (level: number, streak: number) => boolean;
};

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const VOICES: VoiceConfig[] = [
  {
    id: "warm",
    name: "Warm",
    description:
      "Supportive and curious. Believes in you. Makes you feel seen.",
    unlockLabel: "Always unlocked",
    isUnlocked: () => true,
  },
  {
    id: "coach",
    name: "Coach",
    description:
      "Direct and tactical. Focused on performance and execution. In your corner.",
    unlockLabel: "Unlock at Sophomore (level 6)",
    isUnlocked: (level) => level >= 6,
  },
  {
    id: "mentor",
    name: "Mentor",
    description:
      "Wise and patient. Connects today to the bigger journey. Long view, always.",
    unlockLabel: "Unlock at Sophomore (level 6)",
    isUnlocked: (level) => level >= 6,
  },
  {
    id: "challenger",
    name: "Challenger",
    description:
      "Skeptical and demanding. Makes you prove it. Expects more.",
    unlockLabel: "Unlock at Junior (level 16)",
    isUnlocked: (level) => level >= 16,
  },
  {
    id: "mamba",
    name: "The Mamba",
    description:
      "Relentless excellence. No excuses. Obsessive about the details. Every day counts.",
    unlockLabel: "Unlock at Builder (level 52) with a 21-day streak",
    isUnlocked: (level, streak) => level >= 52 && streak >= 21,
  },
];

// ── COMPONENT ─────────────────────────────────────────────────────────────────
export default function VoiceSelector({ level, streak, currentVoice }: Props) {

  // ── STATE ───────────────────────────────────────────────────────────────────
  const [selected, setSelected] = useState(currentVoice);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── HANDLERS ────────────────────────────────────────────────────────────────
  async function handleSelect(voiceId: string) {
    if (voiceId === selected || saving) return;

    setSaving(true);
    setError(null);

    const response = await fetch("/api/users/voice", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voice: voiceId }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("voice: save failed", data);
      setError(data.error ?? "Failed to save. Try again.");
      setSaving(false);
      return;
    }

    setSelected(voiceId);
    setSaving(false);
  }

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-3">
      {VOICES.map((voice) => {
        const unlocked = voice.isUnlocked(level, streak);
        const active = selected === voice.id;

        return (
          <button
            key={voice.id}
            onClick={() => unlocked && handleSelect(voice.id)}
            disabled={!unlocked || saving}
            className={`w-full text-left px-5 py-4 rounded-md border transition-colors ${
              active
                ? "border-[#C9A84C] bg-[#C9A84C]/5"
                : unlocked
                ? "border-[#1F1F1F] bg-[#111111] hover:border-[#C9A84C]/50"
                : "border-[#1F1F1F] bg-[#0D0D0D] opacity-40 cursor-not-allowed"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <span
                className={`text-sm font-semibold ${
                  active ? "text-[#C9A84C]" : unlocked ? "text-[#F0EDEA]" : "text-[#6B6B6B]"
                }`}
              >
                {voice.name}
              </span>
              {active && (
                <span className="text-xs text-[#C9A84C] uppercase tracking-wide">
                  Active
                </span>
              )}
              {!unlocked && (
                <span className="text-xs text-[#3A3A3A]">Locked</span>
              )}
            </div>
            <p className="text-xs text-[#6B6B6B] mt-1 leading-relaxed">
              {unlocked ? voice.description : voice.unlockLabel}
            </p>
          </button>
        );
      })}

      {error && (
        <p className="text-sm text-[#7B2D2D] text-center">{error}</p>
      )}

      {saving && (
        <p className="text-xs text-[#6B6B6B] text-center">Saving…</p>
      )}
    </div>
  );
}
