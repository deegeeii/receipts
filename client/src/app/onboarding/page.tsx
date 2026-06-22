// ── IMPORTS ───────────────────────────────────────────────────────────────────
import Link from "next/link";

// ── PAGE ──────────────────────────────────────────────────────────────────────
// OnboardingLogo — first screen: brand statement + entry CTA
export default function OnboardingLogoPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0A] px-6">
      <div className="w-full max-w-sm flex flex-col items-center gap-12">

        <div className="flex flex-col items-center gap-3">
          <h1 className="text-5xl font-bold text-[#C9A84C] tracking-tight">
            Receipt.
          </h1>
          <p className="text-base text-[#6B6B6B] tracking-widest uppercase">
            Prove it. Get paid.
          </p>
        </div>

        <Link
          href="/onboarding/value-prop"
          className="w-full py-4 bg-[#C9A84C] text-[#0A0A0A] font-semibold text-base rounded-md tracking-wide text-center hover:bg-[#E5C97A] transition-colors"
        >
          I&apos;m in
        </Link>

      </div>
    </main>
  );
}
