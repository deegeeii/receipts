"use client";

// ── IMPORTS ───────────────────────────────────────────────────────────────────
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// ── COMPONENT ─────────────────────────────────────────────────────────────────
export default function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();

  // ── HANDLER ───────────────────────────────────────────────────────────────
  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <button
      onClick={handleSignOut}
      className="w-full py-4 border border-[#1F1F1F] text-[#6B6B6B] font-semibold text-sm rounded-md hover:border-[#7B2D2D] hover:text-[#7B2D2D] transition-colors"
    >
      Sign out
    </button>
  );
}
