// ── IMPORTS ───────────────────────────────────────────────────────────────────
import Link from "next/link";

// ── PAGE ──────────────────────────────────────────────────────────────────────
export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A] px-6 py-16">
      <div className="w-full max-w-sm mx-auto flex flex-col gap-10">

        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-bold text-[#F0EDEA]">
            Refund policy.
          </h1>
          <p className="text-sm text-[#6B6B6B] leading-relaxed">
            Straightforward. No fine print.
          </p>
        </div>

        <div className="flex flex-col gap-8">

          <Section title="30-day trial period">
            If you start a project and change your mind within 30 days of your
            deposit, you get a full refund — no questions asked, no penalty.
            Contact us and we&apos;ll process it within 5 business days.
          </Section>

          <Section title="After 30 days">
            After the 30-day window, a 10% early exit fee applies to your
            remaining balance if you cancel. This fee is shown clearly before
            you confirm cancellation. The remaining 90% is returned to you
            immediately via your connected payout account.
          </Section>

          <Section title="Completed projects">
            If you complete your project by the end date, your full remaining
            balance is released — no fee. You earned it.
          </Section>

          <Section title="Payouts already released">
            Daily payouts that have already been released to your account are
            not affected by cancellation. Only the unreleased balance is subject
            to the early exit fee.
          </Section>

          <Section title="How to request a refund">
            Email us at{" "}
            <a
              href="mailto:support@receipts.app"
              className="text-[#C9A84C] hover:underline"
            >
              support@receipts.app
            </a>
            {" "}with your account email and project name. We&apos;ll confirm
            eligibility and process the refund within 5 business days.
          </Section>

        </div>

        <div className="flex flex-col gap-2">
          <Link
            href="/how-it-works"
            className="text-xs text-[#C9A84C] hover:underline"
          >
            How your money works →
          </Link>
          <Link
            href="/auth/login"
            className="text-xs text-[#6B6B6B] hover:text-[#F0EDEA] transition-colors"
          >
            ← Back
          </Link>
        </div>

      </div>
    </main>
  );
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold text-[#F0EDEA] uppercase tracking-wide">
        {title}
      </h2>
      <p className="text-sm text-[#6B6B6B] leading-relaxed">{children}</p>
    </div>
  );
}
