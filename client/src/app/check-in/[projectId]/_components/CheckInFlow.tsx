"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckInMode } from "@/lib/checkIn/getCheckInMode";

// ── TYPES ─────────────────────────────────────────────────────────────────────
type Props = {
  projectId: string;
  projectTitle: string;
  mode: CheckInMode;
};

type CheckInStage = "receipt" | "question" | "done";

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const GROUP_UNLOCKS: Record<string, string> = {
  Sophomore: "Weekly deep reviews are now unlocked.",
  Junior: "Tiered day types are now unlocked.",
  Graduate: "Voice memo and Mystery Door are now unlocked.",
  Builder: "Financial identity tier unlocked.",
  Mogul: "Elite tier unlocked.",
  Legend: "You have reached the top. No ceiling.",
};

// ── HELPERS ───────────────────────────────────────────────────────────────────
function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

// ── COMPONENT ─────────────────────────────────────────────────────────────────
export default function CheckInFlow({ projectId, projectTitle, mode }: Props) {

  // ── STATE ───────────────────────────────────────────────────────────────────
  const router = useRouter();

  const [stage, setStage] = useState<CheckInStage>("receipt");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [receiptText, setReceiptText] = useState("");
  const [question, setQuestion] = useState("");
  const [answerText, setAnswerText] = useState("");
  const [closingMessage, setClosingMessage] = useState("");
  const [payoutAmount, setPayoutAmount] = useState(0);
  const [newLevel, setNewLevel] = useState(0);
  const [leveledUp, setLeveledUp] = useState(false);
  const [levelGroup, setLevelGroup] = useState("");
  const [groupChanged, setGroupChanged] = useState(false);
  const [groupChangeSummary, setGroupChangeSummary] = useState("");
  const [streakReset, setStreakReset] = useState(false);
  const [showGroupOverlay, setShowGroupOverlay] = useState(false);

  // ── EFFECTS ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    setStage("receipt");
    setReceiptText("");
    setQuestion("");
    setAnswerText("");
    setClosingMessage("");
    setPayoutAmount(0);
    setNewLevel(0);
    setLeveledUp(false);
    setLevelGroup("");
    setGroupChanged(false);
    setGroupChangeSummary("");
    setStreakReset(false);
    setShowGroupOverlay(false);
    setError(null);
  }, [projectId]);

  // ── HANDLERS ────────────────────────────────────────────────────────────────
  async function handleSubmitReceipt() {
    setLoading(true);
    setError(null);

    const response = await fetch("/api/check-in/question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: projectId,
        receipt_text: receiptText,
        mode,
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

  async function handleSubmitAnswer() {
    setLoading(true);
    setError(null);

    const response = await fetch("/api/check-in/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: projectId,
        receipt_text: receiptText,
        ai_question: question,
        ai_response: answerText,
        mode,
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
    setNewLevel(data.new_level);
    setLeveledUp(data.leveled_up);
    setLevelGroup(data.level_group);
    setGroupChanged(data.group_changed);
    setGroupChangeSummary(data.group_change_summary ?? "");
    setStreakReset(data.streak_reset ?? false);
    setStage("done");
    setLoading(false);

    if (data.group_changed) {
      setTimeout(() => setShowGroupOverlay(true), 800);
    }
  }

  // ── RENDER ──────────────────────────────────────────────────────────────────
  if (mode === "rest_day") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0A] px-6">
        <div className="w-full max-w-sm flex flex-col gap-8 text-center">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold text-[#F0EDEA]">
              The rest is yours.
            </h2>
            <p className="text-sm text-[#6B6B6B]">
              Today is an off day for {projectTitle}. Come back on your next work day.
            </p>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full py-4 bg-[#111111] border border-[#1F1F1F] text-[#F0EDEA] font-semibold text-base rounded-md tracking-wide hover:border-[#C9A84C] transition-colors"
          >
            Back to dashboard
          </button>
        </div>
      </main>
    );
  }

  const receiptHeading =
    mode === "pending_review" ? "Before you begin."
    : mode === "weekly_review" ? "Weekly Deep Review."
    : "Drop your receipt.";

  const receiptSubtitle =
    mode === "pending_review" ? "Complete last week's review first."
    : mode === "weekly_review" ? "How did this week go?"
    : "What did you actually do today?";

  const receiptLabel =
    mode === "pending_review" || mode === "weekly_review"
      ? "Last week's receipt"
      : "Today's receipt";

  const receiptPlaceholder =
    mode === "pending_review" || mode === "weekly_review"
      ? "Be honest. What actually happened?"
      : "Be specific. This is your proof.";

  const questionLabel =
    mode === "pending_review" || mode === "weekly_review"
      ? "Reflect on it"
      : "One question";

  return (
    <>
      {/* Group change full-screen overlay */}
      {showGroupOverlay && (
        <div className="fixed inset-0 z-50 bg-[#0A0A0A] flex flex-col items-center justify-center px-6 animate-group-rise">
          <div className="w-full max-w-sm flex flex-col items-center gap-8 text-center">

            <div className="flex flex-col gap-2">
              <p className="text-xs text-[#C9A84C] uppercase tracking-widest">
                Rank unlocked
              </p>
              <h1 className="text-5xl font-bold text-[#F0EDEA]">
                {levelGroup}
              </h1>
            </div>

            {groupChangeSummary && (
              <p className="text-sm text-[#6B6B6B] leading-relaxed">
                {groupChangeSummary}
              </p>
            )}

            {GROUP_UNLOCKS[levelGroup] && (
              <div className="w-full px-5 py-4 border border-[#C9A84C]/30 rounded-md">
                <p className="text-sm text-[#C9A84C]">
                  {GROUP_UNLOCKS[levelGroup]}
                </p>
              </div>
            )}

            <button
              onClick={() => setShowGroupOverlay(false)}
              className="w-full py-4 bg-[#C9A84C] text-[#0A0A0A] font-semibold text-base rounded-md tracking-wide hover:bg-[#E5C97A] transition-colors"
            >
              Let&apos;s go
            </button>

          </div>
        </div>
      )}

      <main className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0A] px-6">
        <div className="w-full max-w-sm flex flex-col gap-8">

          {stage === "receipt" && (
            <>
              <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-bold text-[#F0EDEA]">
                  {receiptHeading}
                </h2>
                <p className="text-sm text-[#6B6B6B]">
                  {receiptSubtitle}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="receipt"
                  className="text-xs text-[#6B6B6B] uppercase tracking-wide"
                >
                  {receiptLabel}
                </label>
                <textarea
                  id="receipt"
                  value={receiptText}
                  onChange={(e) => setReceiptText(e.target.value)}
                  rows={5}
                  placeholder={receiptPlaceholder}
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

          {stage === "question" && (
            <>
              <div className="flex flex-col gap-2">
                <span className="text-xs text-[#6B6B6B] uppercase tracking-wide">
                  {questionLabel}
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

          {stage === "done" && (
            <div className="flex flex-col items-center gap-6 text-center">
              <p className="text-lg text-[#F0EDEA] leading-relaxed whitespace-pre-line">
                {closingMessage}
              </p>

              <p className="text-sm text-[#C9A84C] font-semibold">
                {formatCents(payoutAmount)} released
              </p>

              {streakReset && (
                <p className="text-sm text-[#6B6B6B]">
                  Streak reset — but you showed up. That&apos;s the only thing that matters.
                </p>
              )}

              {leveledUp && !groupChanged && (
                <div className="px-4 py-2 border border-[#C9A84C]/50 rounded-md animate-level-flash">
                  <span className="text-sm text-[#C9A84C] font-semibold">
                    Level up — you&apos;re now Level {newLevel}
                  </span>
                </div>
              )}

              {mode === "pending_review" ? (
                <button
                  onClick={() => router.push(`/check-in/${projectId}`)}
                  className="w-full py-4 bg-[#C9A84C] text-[#0A0A0A] font-semibold text-base rounded-md tracking-wide hover:bg-[#E5C97A] transition-colors"
                >
                  Start today&apos;s check-in
                </button>
              ) : (
                <button
                  onClick={() => router.push("/dashboard")}
                  className="w-full py-4 bg-[#111111] border border-[#1F1F1F] text-[#F0EDEA] font-semibold text-base rounded-md tracking-wide hover:border-[#C9A84C] transition-colors"
                >
                  Back to dashboard
                </button>
              )}
            </div>
          )}

          {error && (
            <p className="text-sm text-[#7B2D2D] text-center">{error}</p>
          )}

        </div>
      </main>
    </>
  );
}
