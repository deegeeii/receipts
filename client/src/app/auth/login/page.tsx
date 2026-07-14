// ── IMPORTS ───────────────────────────────────────────────────────────────────
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

// ── PAGE ──────────────────────────────────────────────────────────────────────
export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0A] px-6">
      <div className="w-full max-w-sm flex flex-col items-center gap-10">

        <div className="flex flex-col items-center gap-3">
          <h1 className="text-4xl font-bold tracking-tight text-[#F0EDEA]">
            Receipt
          </h1>
          <p className="text-sm text-[#6B6B6B] tracking-widest uppercase">
            Prove it. Get paid.
          </p>
        </div>

        <div className="w-full flex flex-col gap-4">
          <Link
            href="/auth/email"
            className="w-full py-4 bg-[#C9A84C] text-[#0A0A0A] font-semibold text-base rounded-md tracking-wide text-center hover:bg-[#E5C97A] transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/auth/signup"
            className="w-full py-4 border border-[#1F1F1F] text-[#F0EDEA] font-semibold text-base rounded-md tracking-wide text-center hover:border-[#C9A84C] transition-colors"
          >
            Create account
          </Link>
        </div>

      </div>
    </main>
  );
}
