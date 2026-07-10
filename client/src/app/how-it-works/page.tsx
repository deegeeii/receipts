// ── IMPORTS ───────────────────────────────────────────────────────────────────
import Link from "next/link";

// ── PAGE ──────────────────────────────────────────────────────────────────────
export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A] px-6 py-16">
      <div className="w-full max-w-sm mx-auto flex flex-col gap-10">

        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-bold text-[#F0EDEA]">
            How your money works.
          </h1>
          <p className="text-sm text-[#6B6B6B] leading-relaxed">
            Plain language. No jargon.
          </p>
        </div>

        <div className="flex flex-col gap-8">

          <Section title="Where does my deposit go?">
            When you commit to a project, your deposit is collected by Stripe —
            one of the most trusted payment processors in the world. Receipt
            never holds your money directly. It sits in Stripe&apos;s secure
            infrastructure until you earn it back.
          </Section>

          <Section title="How do I earn it back?">
            Every time you complete a check-in on a work day, a daily payout is
            released to you. That payout transfers to your connected bank or
            debit card via Stripe Connect. You set the daily amount when you
            create the project.
          </Section>

          <Section title="What if I miss a day?">
            A missed day&apos;s payout stays in your balance — it rolls over by
            default. You can choose to donate it to a charity instead. Either
            way, the money doesn&apos;t disappear. It stays yours unless you
            choose to give it away.
          </Section>

          <Section title="What if I cancel early?">
            If you close a project before the end date, your remaining balance
            is returned minus a 10% early exit fee. That fee is clearly shown
            before you confirm. There are no hidden charges.
          </Section>

          <Section title="Is my money safe?">
            Yes. Stripe is a licensed money transmitter regulated in the US and
            internationally. Your funds are held in Stripe&apos;s infrastructure
            — not in a Receipt bank account. Receipt cannot spend or move your
            money outside of the rules you agreed to when you started your
            project.
          </Section>

          <Section title="What about refunds?">
            See our{" "}
            <Link
              href="/refund-policy"
              className="text-[#C9A84C] hover:underline"
            >
              refund policy
            </Link>
            {" "}for full details. The short version: 30 days to get a full
            refund, 10% fee after that.
          </Section>

        </div>

        <Link
          href="/auth/login"
          className="text-xs text-[#6B6B6B] hover:text-[#F0EDEA] transition-colors"
        >
          ← Back
        </Link>

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
