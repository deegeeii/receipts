// ── IMPORTS ───────────────────────────────────────────────────────────────────
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// ── TYPES ─────────────────────────────────────────────────────────────────────
type Action = "complete" | "cancel";

type ProjectActionsProps = {
  projectId: string;
};

// ── COMPONENT ─────────────────────────────────────────────────────────────────
// ProjectActions — Complete / Cancel Early buttons with inline confirmation
export default function ProjectActions({ projectId }: ProjectActionsProps) {
  const router = useRouter();

  // ── STATE ───────────────────────────────────────────────────────────────────
  const [confirming, setConfirming] = useState<Action | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── HANDLERS ──────────────────────────────────────────────────────────────
  async function handleConfirm() {
    if (!confirming) return;
    setLoading(true);
    setError(null);

    const response = await fetch(`/api/projects/${projectId}/close`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: confirming }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("ProjectActions: close failed", data);
      setError(data.error ?? "Something went wrong. Try again.");
      setLoading(false);
      return;
    }

    router.refresh();
  }

  // ── RENDER ──────────────────────────────────────────────────────────────────
  if (confirming) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-[#F0EDEA]">
          {confirming === "complete"
            ? "Mark this project complete and release your remaining balance?"
            : "Cancel early? A 10% penalty applies to your remaining balance."}
        </p>

        {error && (
          <p className="text-xs text-[#7B2D2D]">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 py-3 bg-[#C9A84C] text-[#0A0A0A] font-semibold text-sm rounded-md hover:bg-[#E5C97A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Processing..." : "Confirm"}
          </button>

          <button
            onClick={() => {
              setConfirming(null);
              setError(null);
            }}
            disabled={loading}
            className="flex-1 py-3 border border-[#1F1F1F] text-[#F0EDEA] font-semibold text-sm rounded-md hover:border-[#C9A84C] disabled:opacity-40 transition-colors"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <button
        onClick={() => setConfirming("complete")}
        className="flex-1 py-3 border border-[#2D6A4F] text-[#2D6A4F] font-semibold text-sm rounded-md hover:bg-[#2D6A4F]/10 transition-colors"
      >
        Complete
      </button>

      <button
        onClick={() => setConfirming("cancel")}
        className="flex-1 py-3 border border-[#1F1F1F] text-[#6B6B6B] font-semibold text-sm rounded-md hover:border-[#7B2D2D] hover:text-[#7B2D2D] transition-colors"
      >
        Cancel early
      </button>
    </div>
  );
}
