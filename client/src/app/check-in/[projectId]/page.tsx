"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

type CheckInStage = "receipt" | "question" | "done";

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

// CheckInPage — the daily Receipt loop: drop receipt -> live AI question -> answer -> verify/payout
export default function CheckInPage() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();

  // stage drives which screen of the loop is shown
  const [stage, setStage] = useState<CheckInStage>("receipt");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // receiptText/answerText — user input; question/closingMessage/payoutAmount — AI + server output
  const [receiptText, setReceiptText] = useState("");
  const [question, setQuestion] = useState("");
  const [answerText, setAnswerText] = useState("");
  const [closingMessage, setClosingMessage] = useState("");
  const [payoutAmount, setPayoutAmount] = useState(0);

  // Step 1 — sends the receipt, gets back a live follow-up question from the AI
  async function handleSubmitReceipt() {
    setLoading(true);
    setError(null);

    const response = await fetch("/api/check-in/question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: params.projectId,
        receipt_text: receiptText,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("check-in question failed", data);
      setError(data.error ?? `Request failed with status ${response.status}`);
      setLoading(false);
      return;
    }

    setQuestion(data.question);
    setStage("question");
    setLoading(false);
  }

  // Step 2 — sends the answer, gets back the AI's closing message and the payout amount
  async function handleSubmitAnswer() {
    setLoading(true);
    setError(null);

    const response = await fetch("/api/check-in/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: params.projectId,
        receipt_text: receiptText,
        ai_question: question,
        ai_response: answerText,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("check-in verify failed", data);
      setError(data.error ?? `Request failed with status ${response.status}`);
      setLoading(false);
      return;
    }

    setClosingMessage(data.closing_message);
    setPayoutAmount(data.payout_amount);
    setStage("done");
    setLoading(false);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0A] px-6">
      <div className="w-full max-w-sm flex flex-col gap-8">

        {/* Stage 1 — receipt input */}
        {stage === "receipt" && (
          <>
            <div className="flex flex-col gap-1">
              <h2 className="text-2xl font-bold text-[#F0EDEA]">
                Drop your receipt.
              </h2>
              <p className="text-sm text-[#6B6B6B]">
                What did you actually do today?
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="receipt"
                className="text-xs text-[#6B6B6B] uppercase tracking-wide"
              >
                Today&apos;s receipt
              </label>
              <textarea
                id="receipt"
                value={receiptText}
                onChange={(e) => setReceiptText(e.target.value)}
                rows={5}
                placeholder="Be specific. This is your proof."
                className="w-full px-4 py-3 bg-[#111111] border border-[#1F1F1F] rounded-md text-[#F0EDEA] placeholder-[#6B6B6B] text-sm resize-none focus:outline-none focus:border-[#C9A84C] transition-colors"
              />
            </div>

            <button
              onClick={handleSubmitReceipt}
              disabled={loading || receiptText.trim().length === 0}
              className="w-full py-4 bg-[#C9A84C] text-[#0A0A0A] font-semibold text-base rounded-md tracking-wide hover:bg-[#E5C97A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Reading..." : "Drop it"}
            </button>
          </>
        )}

        {/* Stage 2 — live AI question + answer input */}
        {stage === "question" && (
          <>
            <div className="flex flex-col gap-2">
              <span className="text-xs text-[#6B6B6B] uppercase tracking-wide">
                One question
              </span>
              <p className="text-lg text-[#F0EDEA] leading-relaxed">
                {question}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="answer"
                className="text-xs text-[#6B6B6B] uppercase tracking-wide"
              >
                Your answer
              </label>
              <textarea
                id="answer"
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                rows={4}
                placeholder="Answer it straight."
                className="w-full px-4 py-3 bg-[#111111] border border-[#1F1F1F] rounded-md text-[#F0EDEA] placeholder-[#6B6B6B] text-sm resize-none focus:outline-none focus:border-[#C9A84C] transition-colors"
              />
            </div>

            <button
              onClick={handleSubmitAnswer}
              disabled={loading || answerText.trim().length === 0}
              className="w-full py-4 bg-[#C9A84C] text-[#0A0A0A] font-semibold text-base rounded-md tracking-wide hover:bg-[#E5C97A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Sending..." : "Send it"}
            </button>
          </>
        )}

        {/* Stage 3 — closing message and payout confirmation */}
        {stage === "done" && (
          <div className="flex flex-col items-center gap-6 text-center">
            <p className="text-lg text-[#F0EDEA] leading-relaxed whitespace-pre-line">
              {closingMessage}
            </p>

            <p className="text-sm text-[#C9A84C] font-semibold">
              {formatCents(payoutAmount)} released
            </p>

            <button
              onClick={() => router.push("/dashboard")}
              className="w-full py-4 bg-[#111111] border border-[#1F1F1F] text-[#F0EDEA] font-semibold text-base rounded-md tracking-wide hover:border-[#C9A84C] transition-colors"
            >
              Back to dashboard
            </button>
          </div>
        )}

        {error && (
          <p className="text-sm text-[#7B2D2D] text-center">{error}</p>
        )}

      </div>
    </main>
  );
}
