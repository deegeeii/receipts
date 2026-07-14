"use client";

// ── IMPORTS ───────────────────────────────────────────────────────────────────
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// ── PAGE ──────────────────────────────────────────────────────────────────────
export default function SignUpPage() {
  // ── STATE ─────────────────────────────────────────────────────────────────
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  // ── HANDLER ───────────────────────────────────────────────────────────────
  async function handleSignUp() {
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { name: name.trim() },
      },
    });

    if (error) {
      console.error("signup: failed", error);
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0A] px-6">
      <div className="w-full max-w-sm flex flex-col gap-8">

        <div className="flex flex-col gap-1">
          <p className="text-xs text-[#6B6B6B] uppercase tracking-widest">
            Receipt
          </p>
          <h1 className="text-2xl font-bold text-[#F0EDEA]">
            Put something on the line
          </h1>
        </div>

        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            autoComplete="name"
            className="w-full px-4 py-3 bg-[#111111] border border-[#1F1F1F] rounded-md text-[#F0EDEA] placeholder-[#6B6B6B] text-sm focus:outline-none focus:border-[#C9A84C] transition-colors"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            autoComplete="email"
            className="w-full px-4 py-3 bg-[#111111] border border-[#1F1F1F] rounded-md text-[#F0EDEA] placeholder-[#6B6B6B] text-sm focus:outline-none focus:border-[#C9A84C] transition-colors"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="new-password"
            onKeyDown={(e) => e.key === "Enter" && handleSignUp()}
            className="w-full px-4 py-3 bg-[#111111] border border-[#1F1F1F] rounded-md text-[#F0EDEA] placeholder-[#6B6B6B] text-sm focus:outline-none focus:border-[#C9A84C] transition-colors"
          />
          {error && (
            <p className="text-sm text-[#7B2D2D]">{error}</p>
          )}
        </div>

        <button
          onClick={handleSignUp}
          disabled={loading || !name || !email || !password}
          className="w-full py-4 bg-[#C9A84C] text-[#0A0A0A] font-semibold text-base rounded-md tracking-wide hover:bg-[#E5C97A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>

        <p className="text-center text-sm text-[#6B6B6B]">
          Already have an account?{" "}
          <Link href="/auth/email" className="text-[#C9A84C] hover:underline">
            Sign in
          </Link>
        </p>

      </div>
    </main>
  );
}
