"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { stripePromise } from "@/lib/stripe/client";
import { useProjectSetupStore } from "@/lib/stores/projectSetupStore";

function formatCents(cents: number): string {
  return `$${(cents / 100).toLocaleString()}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

type PaymentFormProps = {
  onSuccess: (paymentIntentId: string) => void;
  submitting: boolean;
};

// PaymentForm — must live inside <Elements> to access useStripe/useElements
function PaymentForm({ onSuccess, submitting }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  async function handleConfirm() {
    if (!stripe || !elements) return;
    setProcessing(true);
    setPaymentError(null);

    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (stripeError) {
      console.error("review: payment failed", stripeError);
      setPaymentError(
        stripeError.message ?? "Payment failed. Try again."
      );
      setProcessing(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      onSuccess(paymentIntent.id);
    }
  }

  const busy = processing || submitting;

  return (
    <div className="flex flex-col gap-6">
      <PaymentElement
        options={{
          layout: "tabs",
        }}
      />

      {paymentError && (
        <p className="text-sm text-[#7B2D2D] text-center">{paymentError}</p>
      )}

      <button
        onClick={handleConfirm}
        disabled={busy || !stripe || !elements}
        className="w-full py-4 bg-[#C9A84C] text-[#0A0A0A] font-semibold text-base rounded-md tracking-wide hover:bg-[#E5C97A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {busy ? "Processing..." : "I'm in. Lock it in."}
      </button>
    </div>
  );
}

// ReviewAndCommitStep — fetches PaymentIntent on mount, renders summary + Stripe card input
export default function ReviewAndCommitStep() {
  const router = useRouter();
  const setup = useProjectSetupStore((state) => state);
  const reset = useProjectSetupStore((state) => state.reset);

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loadingIntent, setLoadingIntent] = useState(true);
  const [intentError, setIntentError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!setup.deposit_amount) return;

    async function createIntent() {
      const response = await fetch("/api/stripe/payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: setup.deposit_amount }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("review: payment intent failed", data);
        setIntentError(data.error ?? "Could not initialize payment.");
        setLoadingIntent(false);
        return;
      }

      setClientSecret(data.client_secret);
      setLoadingIntent(false);
    }

    createIntent();
  }, [setup.deposit_amount]);

  async function handlePaymentSuccess(paymentIntentId: string) {
    setSubmitting(true);
    setSubmitError(null);

    const response = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: setup.title,
        description: setup.description,
        deposit_amount: setup.deposit_amount,
        daily_payout: setup.daily_payout,
        start_date: setup.start_date,
        end_date: setup.end_date,
        work_days: setup.work_days,
        work_style: setup.work_style,
        obstacle_patterns: setup.obstacle_patterns,
        good_day_description: setup.good_day_description,
        hard_day_description: setup.hard_day_description,
        tasks: setup.tasks,
        stripe_payment_intent_id: paymentIntentId,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      console.error("review: project create failed", data);
      setSubmitError(data.error ?? "Something went wrong. Try again.");
      setSubmitting(false);
      return;
    }

    reset();
    router.push("/dashboard");
  }

  const elementsOptions = {
    clientSecret: clientSecret ?? undefined,
    appearance: {
      theme: "night" as const,
      variables: {
        colorPrimary: "#C9A84C",
        colorBackground: "#111111",
        colorText: "#F0EDEA",
        colorDanger: "#ef4444",
        fontFamily: "inherit",
        borderRadius: "6px",
      },
    },
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0A] px-6 py-12">
      <div className="w-full max-w-sm flex flex-col gap-8">

        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-[#F0EDEA]">
            Lock it in.
          </h2>
          <p className="text-sm text-[#6B6B6B]">
            Once you confirm, the deposit is on.
          </p>
        </div>

        <div className="flex flex-col gap-4 px-5 py-5 bg-[#111111] border border-[#1F1F1F] rounded-md">
          <div className="flex justify-between items-baseline">
            <span className="text-xs text-[#6B6B6B] uppercase tracking-wide">
              Project
            </span>
            <span className="text-sm font-semibold text-[#F0EDEA]">
              {setup.title}
            </span>
          </div>

          <div className="flex justify-between items-baseline">
            <span className="text-xs text-[#6B6B6B] uppercase tracking-wide">
              Deposit
            </span>
            <span className="text-sm font-semibold text-[#C9A84C]">
              {setup.deposit_amount !== null &&
                formatCents(setup.deposit_amount)}
            </span>
          </div>

          <div className="flex justify-between items-baseline">
            <span className="text-xs text-[#6B6B6B] uppercase tracking-wide">
              Daily payout
            </span>
            <span className="text-sm font-semibold text-[#F0EDEA]">
              {setup.daily_payout !== null && formatCents(setup.daily_payout)}
            </span>
          </div>

          <div className="flex justify-between items-baseline">
            <span className="text-xs text-[#6B6B6B] uppercase tracking-wide">
              Runs
            </span>
            <span className="text-sm font-semibold text-[#F0EDEA]">
              {setup.start_date && formatDate(setup.start_date)} —{" "}
              {setup.end_date && formatDate(setup.end_date)}
            </span>
          </div>
        </div>

        {loadingIntent && (
          <p className="text-sm text-[#6B6B6B] text-center">
            Preparing payment...
          </p>
        )}

        {intentError && (
          <p className="text-sm text-[#7B2D2D] text-center">{intentError}</p>
        )}

        {clientSecret && (
          <Elements
            stripe={stripePromise}
            options={elementsOptions}
          >
            <PaymentForm
              onSuccess={handlePaymentSuccess}
              submitting={submitting}
            />
          </Elements>
        )}

        {submitError && (
          <p className="text-sm text-[#7B2D2D] text-center">{submitError}</p>
        )}

      </div>
    </main>
  );
}
