"use client";

// ── IMPORTS ───────────────────────────────────────────────────────────────────
import { useState } from "react";

// ── TYPES ─────────────────────────────────────────────────────────────────────
type Props = {
  isConnected: boolean;
};

// ── COMPONENT ─────────────────────────────────────────────────────────────────
export default function PayoutSettings({ isConnected }: Props) {

  // ── STATE ───────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── HANDLERS ────────────────────────────────────────────────────────────────
  async function handleConnect() {
    setLoading(true);
    setError(null);

    const response = await fetch("/api/stripe/connect", { method: "POST" });
    const data = await response.json();

    if (!response.ok) {
      console.error("payout settings: connect failed", data);
      setError(data.error ?? "Something went wrong. Try again.");
      setLoading(false);
      return;
    }

    window.location.href = data.url;
  }

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-3">

      {isConnected ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-5 py-4 bg-[#111111] border border-[#1F1F1F] rounded-md">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-[#2D6A4F] shrink-0" />
              <span className="text-sm text-[#F0EDEA]">Bank account connected</span>
            </div>
            <button
              onClick={handleConnect}
              disabled={loading}
              className="text-xs text-[#6B6B6B] hover:text-[#C9A84C] transition-colors disabled:opacity-40"
            >
              {loading ? "Loading…" : "Update"}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-[#6B6B6B]">
            Link your bank account to receive payouts when you check in.
          </p>
          <button
            onClick={handleConnect}
            disabled={loading}
            className="w-full py-3 bg-[#C9A84C] text-[#0A0A0A] font-semibold text-sm rounded-md hover:bg-[#E5C97A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Redirecting…" : "Set up payouts"}
          </button>
        </div>
      )}

      {error && (
        <p className="text-sm text-[#7B2D2D]">{error}</p>
      )}

    </div>
  );
}
