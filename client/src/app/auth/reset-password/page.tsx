"use client";

// ── IMPORTS ───────────────────────────────────────────────────────────────────
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// ── INNER ─────────────────────────────────────────────────────────────────────
function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  async function handleReset() {
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      console.error("reset password: update failed", error);
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New password"
          autoComplete="new-password"
          className="w-full px-4 py-3 bg-[#111111] border border-[#1F1F1F] rounded-md text-[#F0EDEA] placeholder-[#6B6B6B] text-sm focus:outline-none focus:border-[#C9A84C] transition-colors"
        />
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Confirm password"
          autoComplete="new-password"
          onKeyDown={(e) => e.key === "Enter" && handleReset()}
          className="w-full px-4 py-3 bg-[#111111] border border-[#1F1F1F] rounded-md text-[#F0EDEA] placeholder-[#6B6B6B] text-sm focus:outline-none focus:border-[#C9A84C] transition-colors"
        />
        {error && (
          <p className="text-sm text-[#7B2D2D]">{error}</p>
        )}
      </div>

      <button
        onClick={handleReset}
        disabled={loading || !password || !confirm}
        className="w-full py-4 bg-[#C9A84C] text-[#0A0A0A] font-semibold text-base rounded-md tracking-wide hover:bg-[#E5C97A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Saving…" : "Set new password"}
      </button>
    </div>
  );
}


// ── PAGE ──────────────────────────────────────────────────────────────────────
export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0A] px-6">
      <div className="w-full max-w-sm flex flex-col gap-8">

        <div className="flex flex-col gap-1">
          <p className="text-xs text-[#6B6B6B] uppercase tracking-widest">
            Receipt
          </p>
          <h1 className="text-2xl font-bold text-[#F0EDEA]">
            Set new password
          </h1>
        </div>

        <Suspense fallback={<p className="text-sm text-[#6B6B6B]">Loading…</p>}>
          <ResetPasswordForm />
        </Suspense>

      </div>
    </main>
  );
}
