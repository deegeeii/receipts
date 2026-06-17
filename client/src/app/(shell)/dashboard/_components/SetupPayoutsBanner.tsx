"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// SetupPayoutsBanner — prompts users to link their bank via Stripe Connect before payouts can be released
export default function SetupPayoutsBanner() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConnect() {
    setLoading(true);
    setError(null);

    const response = await fetch("/api/stripe/connect", {
      method: "POST",
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("SetupPayoutsBanner: connect failed", data);
      setError(data.error ?? "Something went wrong. Try again.");
      setLoading(false);
      return;
    }

    window.location.href = data.url;
  }

  return (
    <div className="w-full flex flex-col gap-3 px-4 py-4 border border-[#C9A84C]/40 rounded-md bg-[#C9A84C]/5">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-[#C9A84C]">
          Set up payouts to receive your earnings.
        </p>
        <p className="text-xs text-[#6B6B6B]">
          Link your bank account through Stripe. Takes 2 minutes.
        </p>
      </div>

      {error && (
        <p className="text-xs text-[#7B2D2D]">{error}</p>
      )}

      <button
        onClick={handleConnect}
        disabled={loading}
        className="w-full py-3 bg-[#C9A84C] text-[#0A0A0A] font-semibold text-sm rounded-md tracking-wide hover:bg-[#E5C97A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Redirecting..." : "Set up payouts"}
      </button>
    </div>
  );
}
