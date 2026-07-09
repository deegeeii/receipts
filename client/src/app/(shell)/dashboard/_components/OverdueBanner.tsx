// ── IMPORTS ───────────────────────────────────────────────────────────────────
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// ── TYPES ─────────────────────────────────────────────────────────────────────
type Props = {
  projectId: string;
  projectTitle: string;
  currentEndDate: string;
};

// ── COMPONENT ─────────────────────────────────────────────────────────────────
export default function OverdueBanner({
  projectId,
  projectTitle,
  currentEndDate,
}: Props) {

  // ── STATE ───────────────────────────────────────────────────────────────────
  const router = useRouter();
  const [mode, setMode] = useState<"idle" | "extend" | "close">("idle");
  const [newEndDate, setNewEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ── HANDLERS ────────────────────────────────────────────────────────────────
  async function handleExtend() {
    if (!newEndDate) return;
    setLoading(true);
    setError("");

    const res = await fetch(`/api/projects/${projectId}/extend`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ new_end_date: newEndDate }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Failed to extend. Try again.");
      setLoading(false);
      return;
    }

    router.refresh();
  }

  async function handleClose(action: "complete" | "cancel") {
    setLoading(true);
    setError("");

    const res = await fetch(`/projects/${projectId}/close`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Failed to close. Try again.");
      setLoading(false);
      return;
    }

    router.refresh();
  }

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4 px-5 py-5 bg-[#111111] border border-[#7B2D2D] rounded-md">

      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-[#F0EDEA]">
          {projectTitle} is overdue
        </p>
        <p className="text-xs text-[#6B6B6B]">
          End date passed. Extend the timeline or close the project.
        </p>
      </div>

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      {mode === "idle" && (
        <div className="flex gap-3">
          <button
            onClick={() => setMode("extend")}
            className="flex-1 py-3 bg-[#C9A84C] text-[#0A0A0A] font-semibold text-sm rounded-md hover:bg-[#E5C97A] transition-colors"
          >
            Extend
          </button>
          <button
            onClick={() => setMode("close")}
            className="flex-1 py-3 border border-[#1F1F1F] text-[#6B6B6B] text-sm rounded-md hover:text-[#F0EDEA] hover:border-[#F0EDEA] transition-colors"
          >
            Close
          </button>
        </div>
      )}

      {mode === "extend" && (
        <div className="flex flex-col gap-3">
          <input
            type="date"
            value={newEndDate}
            min={currentEndDate}
            onChange={(e) => setNewEndDate(e.target.value)}
            className="w-full px-4 py-3 bg-[#0A0A0A] border border-[#1F1F1F] rounded-md text-[#F0EDEA] text-sm focus:outline-none focus:border-[#C9A84C] transition-colors"
          />
          <div className="flex gap-3">
            <button
              onClick={handleExtend}
              disabled={!newEndDate || loading}
              className="flex-1 py-3 bg-[#C9A84C] text-[#0A0A0A] font-semibold text-sm rounded-md hover:bg-[#E5C97A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Saving..." : "Confirm"}
            </button>
            <button
              onClick={() => setMode("idle")}
              className="flex-1 py-3 border border-[#1F1F1F] text-[#6B6B6B] text-sm rounded-md hover:text-[#F0EDEA] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {mode === "close" && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-[#6B6B6B]">
            Complete releases your full remaining balance. Cancel applies a 10% penalty.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => handleClose("complete")}
              disabled={loading}
              className="flex-1 py-3 bg-[#C9A84C] text-[#0A0A0A] font-semibold text-sm rounded-md hover:bg-[#E5C97A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Processing..." : "Complete"}
            </button>
            <button
              onClick={() => handleClose("cancel")}
              disabled={loading}
              className="flex-1 py-3 border border-[#7B2D2D] text-[#7B2D2D] text-sm rounded-md hover:bg-[#7B2D2D]/10 disabled:opacity-40 transition-colors"
            >
              {loading ? "Processing..." : "Cancel"}
            </button>
          </div>
          <button
            onClick={() => setMode("idle")}
            className="text-xs text-[#6B6B6B] hover:text-[#F0EDEA] transition-colors text-center"
          >
            Go back
          </button>
        </div>
      )}

    </div>
  );
}
