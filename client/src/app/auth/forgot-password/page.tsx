"use client";

// ── IMPORTS ───────────────────────────────────────────────────────────────────
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// ── PAGE ──────────────────────────────────────────────────────────────────────
export default function ForgotPasswordPage() {
  // ── STATE ─────────────────────────────────────────────────────────────────
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // ── HANDLER ───────────────────────────────────────────────────────────────
  async function handleSend() {
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
    });
      
    if (error) {
      console.error("forgot password: failed", error);
      setError(error.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  // ── RENDER ────────────────────────────────────────────────────────────────
  if (sent) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0A] px-6">
        <div className="w-full max-w-sm flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <p className="text-xs text-[#6B6B6B] uppercase tracking-widest">
              Receipt
            </p>
            <h1 className="text-2xl font-bold text-[#F0EDEA]">
              Check your email
            </h1>
            <p className="text-sm text-[#6B6B6B]">
              We sent a reset link to {email}
            </p>
          </div>
          <Link
            href="/auth/email"
            className="text-xs text-[#6B6B6B] hover:text-[#C9A84C] transition-colors"
          >
            ← Back to sign in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0A] px-6">
      <div className="w-full max-w-sm flex flex-col gap-8">

        <div className="flex flex-col gap-1">
          <p className="text-xs text-[#6B6B6B] uppercase tracking-widest">
            Receipt
          </p>
          <h1 className="text-2xl font-bold text-[#F0EDEA]">
            Reset password
          </h1>
          <p className="text-sm text-[#6B6B6B]">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            autoComplete="email"
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="w-full px-4 py-3 bg-[#111111] border border-[#1F1F1F] rounded-md text-[#F0EDEA] placeholder-[#6B6B6B] text-sm focus:outline-none focus:border-[#C9A84C] transition-colors"
          />
          {error && (
            <p className="text-sm text-[#7B2D2D]">{error}</p>
          )}
        </div>

        <button
          onClick={handleSend}
          disabled={loading || !email}
          className="w-full py-4 bg-[#C9A84C] text-[#0A0A0A] font-semibold text-base rounded-md tracking-wide hover:bg-[#E5C97A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Sending…" : "Send reset link"}
        </button>

        <Link
          href="/auth/email"
          className="text-center text-xs text-[#6B6B6B] hover:text-[#C9A84C] transition-colors"
        >
          ← Back to sign in
        </Link>

      </div>
    </main>
  );
}
