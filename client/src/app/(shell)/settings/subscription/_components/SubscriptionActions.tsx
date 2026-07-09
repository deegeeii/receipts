// ── IMPORTS ───────────────────────────────────────────────────────────────────
"use client";

import { useState } from "react";
import Link from "next/link";

// ── TYPES ─────────────────────────────────────────────────────────────────────
type Props = {
  tier: "standard" | "pro";
};

// ── COMPONENT ─────────────────────────────────────────────────────────────────
export default function SubscriptionActions({ tier }: Props) {

  // ── STATE ───────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ── HANDLERS ────────────────────────────────────────────────────────────────
  async function handleUpgrade() {
    setLoading(true);
    setError("");

    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.url) {
      setError("Something went wrong. Try again.");
      setLoading(false);
      return;
    }

    window.location.href = data.url;
  }

  async function handleManage() {
    setLoading(true);
    setError("");

    const res = await fetch("/api/stripe/portal", {
      method: "POST",
    });

    const data = await res.json();

    if (!res.ok || !data.url) {
      setError("Something went wrong. Try again.");
      setLoading(false);
      return;
    }

    window.location.href = data.url;
  }

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p className="text-xs text-red-400 text-center">{error}</p>
      )}

      {tier === "standard" ? (
        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full py-4 bg-[#C9A84C] text-[#0A0A0A] font-semibold text-base rounded-md tracking-wide hover:bg-[#E5C97A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Redirecting..." : "Upgrade to Pro — $20/mo"}
        </button>
      ) : (
        <button
          onClick={handleManage}
          disabled={loading}
          className="w-full py-4 bg-[#C9A84C] text-[#0A0A0A] font-semibold text-base rounded-md tracking-wide hover:bg-[#E5C97A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Redirecting..." : "Manage billing"}
        </button>
      )}

      <Link
        href="/dashboard"
        className="w-full py-4 text-[#6B6B6B] text-sm hover:text-[#F0EDEA] transition-colors text-center"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
