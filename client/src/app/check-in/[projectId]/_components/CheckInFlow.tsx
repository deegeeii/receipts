"use client";

// ── IMPORTS ───────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { CheckInMode } from "@/lib/checkIn/getCheckInMode";

// ── TYPES ─────────────────────────────────────────────────────────────────────
type Props = {
  projectId: string;
  projectTitle: string;
  mode: CheckInMode;
  canUseVoice: boolean;
  canUseMystery: boolean;
  shortModePasses: number;
  freezeDaysAvailable: number;
};

type CheckInStage = "receipt" | "question" | "done";
type VoiceStage = "idle" | "recording" | "transcribing" | "confirm";
type MysteryFormat =
  | "timed_write"
  | "ai_quiz"
  | "one_word_expand"
  | "gut_check"
  | "draw_a_scene";

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

function formatTime(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

// ── COMPONENT ─────────────────────────────────────────────────────────────────
export default function CheckInFlow({
  projectId,
  projectTitle,
  mode,
  canUseVoice,
  canUseMystery,
  shortModePasses,
  freezeDaysAvailable,
}: Props) {

  // ── STATE ───────────────────────────────────────────────────────────────────
  const router = useRouter();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [stage, setStage] = useState<CheckInStage>("receipt");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [receiptText, setReceiptText] = useState("");
  const [question, setQuestion] = useState("");
  const [question2, setQuestion2] = useState("");
  const [answerText, setAnswerText] = useState("");
  const [answerText2, setAnswerText2] = useState("");
  const [closingMessage, setClosingMessage] = useState("");
  const [payoutAmount, setPayoutAmount] = useState(0);
  const [newLevel, setNewLevel] = useState(0);
  const [leveledUp, setLeveledUp] = useState(false);
  const [levelGroup, setLevelGroup] = useState("");
  const [groupChanged, setGroupChanged] = useState(false);
  const [groupChangeSummary, setGroupChangeSummary] = useState("");
  const [streakReset, setStreakReset] = useState(false);
  const [showGroupOverlay, setShowGroupOverlay] = useState(false);

  const [voiceStage, setVoiceStage] = useState<VoiceStage>("idle");
  const [transcript, setTranscript] = useState("");
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const [mysteryActive, setMysteryActive] = useState(false);
  const [mysteryLoading, setMysteryLoading] = useState(false);
  const [mysteryFormat, setMysteryFormat] = useState<MysteryFormat | null>(null);
  const [mysteryPrompt, setMysteryPrompt] = useState("");
  const [mysteryQuestions, setMysteryQuestions] = useState<string[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<string[]>(["", "", ""]);
  const [oneWord, setOneWord] = useState("");
  const [oneWordRevealed, setOneWordRevealed] = useState(false);
  const [gutRating, setGutRating] = useState<number | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(120);

  const [shortModeActive, setShortModeActive] = useState(false);
  const [freezeConfirming, setFreezeConfirming] = useState(false);
  const [freezeLoading, setFreezeLoading] = useState(false);
  const [frozeToday, setFrozeToday] = useState(false);
  const [freezeDaysRemaining, setFreezeDaysRemaining] = useState(freezeDaysAvailable);

  const [shortModePassEarned, setShortModePassEarned] = useState(false);
  const [freezeDayEarned, setFreezeDayEarned] = useState(false);

  // ── EFFECTS ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    setStage("receipt");
    setReceiptText("");
    setQuestion("");
    setQuestion2("");
    setAnswerText("");
    setAnswerText2("");
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
    setVoiceStage("idle");
    setTranscript("");
    setVoiceError(null);
    setMysteryActive(false);
    setMysteryLoading(false);
    setMysteryFormat(null);
    setMysteryPrompt("");
    setMysteryQuestions([]);
    setQuizAnswers(["", "", ""]);
    setOneWord("");
    setOneWordRevealed(false);
    setGutRating(null);
    setTimerSeconds(120);
    setShortModeActive(false);
    setFreezeConfirming(false);
    setFrozeToday(false);
    setFreezeDaysRemaining(freezeDaysAvailable);
    setShortModePassEarned(false);
    setFreezeDayEarned(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
  }, [projectId]);

  useEffect(() => {
    if (!mysteryActive || mysteryFormat !== "timed_write") return;

    setTimerSeconds(120);

    timerIntervalRef.current = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [mysteryActive, mysteryFormat]);

  // ── HANDLERS ────────────────────────────────────────────────────────────────
  async function handleVerify(
    q: string,
    a: string,
    q2 = "",
    a2 = "",
    shortModePassUsed = false
  ) {
    setLoading(true);
    setError(null);

    const response = await fetch("/api/check-in/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: projectId,
        receipt_text: receiptText,
        ai_question: q,
        ai_response: a,
        ai_question2: q2,
        ai_response2: a2,
        mode,
        short_mode_pass_used: shortModePassUsed,
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
    setShortModePassEarned(data.short_mode_pass_earned ?? false);
    setFreezeDayEarned(data.freeze_day_earned ?? false);
    setStage("done");
    setLoading(false);

    if (data.group_changed) {
      setTimeout(() => setShowGroupOverlay(true), 800);
    }
  }

  async function handleSubmitReceipt() {
    setLoading(true);
    setError(null);

    if (mode === "light_day" || shortModeActive) {
      await handleVerify("", "", "", "", shortModeActive);
      return;
    }

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

    setQuestion(data.question ?? "");
    setQuestion2(data.question2 ?? "");
    setStage("question");
    setLoading(false);
  }

  async function handleSubmitAnswer() {
    await handleVerify(question, answerText, question2, answerText2);
  }

  async function handleStartRecording() {
    setVoiceError(null);

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      console.error("voice: microphone access denied", err);
      setVoiceError("Microphone access denied. Check your browser permissions.");
      return;
    }

    audioChunksRef.current = [];
    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });

      setVoiceStage("transcribing");

      const formData = new FormData();
      formData.append("audio", blob, "memo.webm");

      const response = await fetch("/api/check-in/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("voice: transcription failed", data);
        setVoiceError(data.error ?? "Transcription failed. Try typing instead.");
        setVoiceStage("idle");
        return;
      }

      setTranscript(data.transcript ?? "");
      setVoiceStage("confirm");
    };

    recorder.start();
    setVoiceStage("recording");
  }

  function handleStopRecording() {
    mediaRecorderRef.current?.stop();
  }

  function handleConfirmTranscript() {
    setReceiptText(transcript);
    setVoiceStage("idle");
  }

  function handleRetryVoice() {
    setTranscript("");
    setVoiceStage("idle");
  }

  async function handleEnterMysteryDoor() {
    setMysteryLoading(true);
    setError(null);

    const response = await fetch("/api/check-in/question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: projectId,
        receipt_text: "",
        mode: "mystery_door",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("mystery door: format fetch failed", data);
      setError(data.error ?? "Failed to load the mystery format.");
      setMysteryLoading(false);
      return;
    }

    setMysteryFormat(data.format as MysteryFormat);
    setMysteryPrompt(data.prompt ?? "");
    setMysteryQuestions(data.questions ?? []);
    setMysteryActive(true);
    setMysteryLoading(false);
  }

  async function handleSubmitMystery() {
    if (!mysteryFormat) return;

    let assembled = "";

    if (mysteryFormat === "timed_write" || mysteryFormat === "draw_a_scene") {
      assembled = receiptText;
    } else if (mysteryFormat === "ai_quiz") {
      assembled = mysteryQuestions
        .map((q, i) => `Q: ${q}\nA: ${quizAnswers[i] ?? ""}`)
        .join("\n\n");
    } else if (mysteryFormat === "one_word_expand") {
      assembled = `${oneWord}: ${receiptText}`;
    } else if (mysteryFormat === "gut_check") {
      assembled = `Rating: ${gutRating}/10\n\n${receiptText}`;
    }

    setLoading(true);
    setError(null);

    const response = await fetch("/api/check-in/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: projectId,
        receipt_text: assembled,
        ai_question: "",
        ai_response: "",
        mystery_format: mysteryFormat,
        mode: "mystery_door",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("mystery door verify failed", data);
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
    setShortModePassEarned(data.short_mode_pass_earned ?? false);
    setFreezeDayEarned(data.freeze_day_earned ?? false);
    setStage("done");
    setLoading(false);

    if (data.group_changed) {
      setTimeout(() => setShowGroupOverlay(true), 800);
    }
  }

  async function handleConfirmFreeze() {
    setFreezeLoading(true);
    setError(null);

    const response = await fetch("/api/check-in/freeze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: projectId }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("freeze: failed", data);
      setError(data.error ?? "Freeze failed. Try again.");
      setFreezeLoading(false);
      setFreezeConfirming(false);
      return;
    }

    setFreezeDaysRemaining(data.freeze_days_remaining ?? 0);
    setFrozeToday(true);
    setFreezeLoading(false);
    setFreezeConfirming(false);
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

  // Freeze success screen
  if (frozeToday) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0A] px-6">
        <div className="w-full max-w-sm flex flex-col gap-8 text-center">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold text-[#F0EDEA]">
              Streak protected.
            </h2>
            <p className="text-sm text-[#6B6B6B]">
              No payout today. Your streak is safe.{" "}
              {freezeDaysRemaining > 0
                ? `${freezeDaysRemaining} freeze day${freezeDaysRemaining === 1 ? "" : "s"} remaining.`
                : "No freeze days remaining."}
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

  const isWorkDayMode =
    mode === "receipt" || mode === "heavy_day" || mode === "light_day";

  const canUseShortModePass =
    shortModePasses > 0 &&
    (mode === "receipt" || mode === "heavy_day") &&
    !shortModeActive;

  const receiptHeading =
    shortModeActive ? "Quick receipt."
    : mode === "pending_review" ? "Before you begin."
    : mode === "weekly_review" ? "Weekly Deep Review."
    : mode === "light_day" ? "Quick receipt."
    : mode === "heavy_day" ? "Peak day receipt."
    : "Drop your receipt.";

  const receiptSubtitle =
    shortModeActive ? "Short mode active — no follow-up question."
    : mode === "pending_review" ? "Complete last week's review first."
    : mode === "weekly_review" ? "How did this week go?"
    : mode === "light_day" ? "One sentence. What did you do today?"
    : mode === "heavy_day" ? "Go deep. This is your heavy day."
    : "What did you actually do today?";

  const receiptLabel =
    mode === "pending_review" || mode === "weekly_review"
      ? "Last week's receipt"
      : "Today's receipt";

  const receiptPlaceholder =
    mode === "pending_review" || mode === "weekly_review"
      ? "Be honest. What actually happened?"
      : mode === "light_day" || shortModeActive
      ? "One sentence is enough."
      : "Be specific. This is your proof.";

  const receiptRows =
    mode === "light_day" || shortModeActive ? 2
    : mode === "heavy_day" ? 7
    : 5;

  const questionLabel =
    mode === "pending_review" || mode === "weekly_review"
      ? "Reflect on it"
      : mode === "heavy_day"
      ? "Peak day questions"
      : "One question";

  const answerDisabled =
    mode === "heavy_day"
      ? loading || answerText.trim().length === 0 || answerText2.trim().length === 0
      : loading || answerText.trim().length === 0;

  const sharedTextareaClass =
    "w-full px-4 py-3 bg-[#111111] border border-[#1F1F1F] rounded-md text-[#F0EDEA] placeholder-[#6B6B6B] text-sm resize-none focus:outline-none focus:border-[#C9A84C] transition-colors";

  const primaryBtn =
    "w-full py-4 bg-[#C9A84C] text-[#0A0A0A] font-semibold text-base rounded-md tracking-wide hover:bg-[#E5C97A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors";

  const ghostBtn =
    "w-full py-3 bg-[#111111] border border-[#1F1F1F] text-[#6B6B6B] text-sm font-semibold rounded-md hover:border-[#C9A84C] hover:text-[#C9A84C] transition-colors";

  return (
    <>
      {/* Group change overlay */}
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
              className={primaryBtn}
            >
              Let&apos;s go
            </button>
          </div>
        </div>
      )}

      <main className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0A] px-6">
        <div className="w-full max-w-sm flex flex-col gap-8">

          {/* ── RECEIPT STAGE — normal flow ─────────────────────────────── */}
          {stage === "receipt" && !mysteryActive && (
            <>
              <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-bold text-[#F0EDEA]">
                  {receiptHeading}
                </h2>
                <p className="text-sm text-[#6B6B6B]">
                  {receiptSubtitle}
                </p>
              </div>

              {/* Freeze confirm */}
              {freezeConfirming && (
                <div className="flex flex-col gap-4 px-5 py-4 border border-[#1F1F1F] rounded-md bg-[#111111]">
                  <p className="text-sm text-[#F0EDEA]">
                    Freeze today? Your streak stays intact but you won&apos;t earn a payout.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setFreezeConfirming(false)}
                      className="flex-1 py-3 bg-[#111111] border border-[#1F1F1F] text-[#6B6B6B] text-sm font-semibold rounded-md hover:border-[#C9A84C] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmFreeze}
                      disabled={freezeLoading}
                      className="flex-1 py-3 bg-[#C9A84C] text-[#0A0A0A] text-sm font-semibold rounded-md hover:bg-[#E5C97A] disabled:opacity-40 transition-colors"
                    >
                      {freezeLoading ? "Freezing…" : "Freeze it"}
                    </button>
                  </div>
                </div>
              )}

              {/* Voice memo confirm */}
              {voiceStage === "confirm" && (
                <div className="flex flex-col gap-4">
                  <p className="text-xs text-[#6B6B6B] uppercase tracking-wide">
                    Did we get that right?
                  </p>
                  <textarea
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    rows={5}
                    className="w-full px-4 py-3 bg-[#111111] border border-[#C9A84C]/40 rounded-md text-[#F0EDEA] text-sm resize-none focus:outline-none focus:border-[#C9A84C] transition-colors"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={handleRetryVoice}
                      className="flex-1 py-3 bg-[#111111] border border-[#1F1F1F] text-[#6B6B6B] text-sm font-semibold rounded-md hover:border-[#C9A84C] transition-colors"
                    >
                      Re-record
                    </button>
                    <button
                      onClick={handleConfirmTranscript}
                      disabled={transcript.trim().length === 0}
                      className="flex-1 py-3 bg-[#C9A84C] text-[#0A0A0A] text-sm font-semibold rounded-md hover:bg-[#E5C97A] disabled:opacity-40 transition-colors"
                    >
                      Looks good
                    </button>
                  </div>
                </div>
              )}

              {/* Normal text input */}
              {voiceStage !== "confirm" && !freezeConfirming && (
                <>
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
                      rows={receiptRows}
                      placeholder={receiptPlaceholder}
                      className={sharedTextareaClass}
                    />
                  </div>

                  {/* Items */}
                  <div className="flex flex-col gap-2">
                    {canUseShortModePass && (
                      <button
                        onClick={() => setShortModeActive(true)}
                        className={ghostBtn}
                      >
                        Use short mode pass ({shortModePasses} left)
                      </button>
                    )}
                    {shortModeActive && (
                      <button
                        onClick={() => setShortModeActive(false)}
                        className="text-xs text-[#6B6B6B] hover:text-[#F0EDEA] transition-colors text-center"
                      >
                        Cancel short mode
                      </button>
                    )}
                    {freezeDaysRemaining > 0 && isWorkDayMode && !shortModeActive && (
                      <button
                        onClick={() => setFreezeConfirming(true)}
                        className={ghostBtn}
                      >
                        Freeze today ({freezeDaysRemaining} left)
                      </button>
                    )}
                  </div>

                  {/* Voice + Mystery (hidden when short mode active) */}
                  {!shortModeActive && (
                    <>
                      {canUseVoice && (
                        <div className="flex flex-col gap-2">
                          {voiceStage === "idle" && (
                            <button onClick={handleStartRecording} className={ghostBtn}>
                              Use voice memo instead
                            </button>
                          )}
                          {voiceStage === "recording" && (
                            <button
                              onClick={handleStopRecording}
                              className="w-full py-3 bg-[#7B2D2D]/20 border border-[#7B2D2D] text-[#F0EDEA] text-sm font-semibold rounded-md hover:bg-[#7B2D2D]/40 transition-colors"
                            >
                              Recording… tap to stop
                            </button>
                          )}
                          {voiceStage === "transcribing" && (
                            <div className="w-full py-3 text-center text-sm text-[#6B6B6B]">
                              Transcribing…
                            </div>
                          )}
                          {voiceError && (
                            <p className="text-xs text-[#7B2D2D]">{voiceError}</p>
                          )}
                        </div>
                      )}

                      {canUseMystery && (
                        <button
                          onClick={handleEnterMysteryDoor}
                          disabled={mysteryLoading}
                          className="w-full py-3 border border-[#C9A84C]/30 text-[#C9A84C] text-sm font-semibold rounded-md hover:border-[#C9A84C] hover:bg-[#C9A84C]/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          {mysteryLoading ? "Opening…" : "Enter the Mystery Door"}
                        </button>
                      )}
                    </>
                  )}

                  <button
                    onClick={handleSubmitReceipt}
                    disabled={loading || receiptText.trim().length === 0}
                    className={primaryBtn}
                  >
                    {loading ? "Reading..." : "Drop it"}
                  </button>
                </>
              )}
            </>
          )}

          {/* ── RECEIPT STAGE — mystery door active ─────────────────────── */}
          {stage === "receipt" && mysteryActive && (
            <>
              <div className="flex flex-col gap-1">
                <p className="text-xs text-[#C9A84C] uppercase tracking-widest">
                  Mystery Door
                </p>
                <h2 className="text-2xl font-bold text-[#F0EDEA]">
                  {mysteryFormat === "timed_write" && "Timed write."}
                  {mysteryFormat === "ai_quiz" && "Three questions."}
                  {mysteryFormat === "one_word_expand" && "One word."}
                  {mysteryFormat === "gut_check" && "Gut check."}
                  {mysteryFormat === "draw_a_scene" && "Draw a scene."}
                </h2>
                <p className="text-sm text-[#6B6B6B]">{mysteryPrompt}</p>
              </div>

              {mysteryFormat === "timed_write" && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#6B6B6B] uppercase tracking-wide">
                      {timerSeconds === 0 ? "Time's up — submit when ready." : "Time remaining"}
                    </span>
                    <span
                      className={`text-2xl font-mono font-bold ${
                        timerSeconds <= 30 && timerSeconds > 0
                          ? "text-[#7B2D2D]"
                          : timerSeconds === 0
                          ? "text-[#6B6B6B]"
                          : "text-[#C9A84C]"
                      }`}
                    >
                      {formatTime(timerSeconds)}
                    </span>
                  </div>
                  <textarea
                    value={receiptText}
                    onChange={(e) => setReceiptText(e.target.value)}
                    readOnly={timerSeconds === 0}
                    rows={8}
                    placeholder="Start writing. Don't stop."
                    className={sharedTextareaClass}
                    autoFocus
                  />
                  <button
                    onClick={handleSubmitMystery}
                    disabled={loading || receiptText.trim().length === 0}
                    className={primaryBtn}
                  >
                    {loading ? "Submitting…" : timerSeconds > 0 ? "Submit early" : "Submit"}
                  </button>
                </div>
              )}

              {mysteryFormat === "ai_quiz" && (
                <div className="flex flex-col gap-6">
                  {mysteryQuestions.map((q, i) => (
                    <div key={i} className="flex flex-col gap-2">
                      <p className="text-base text-[#F0EDEA] leading-relaxed">{q}</p>
                      <textarea
                        value={quizAnswers[i]}
                        onChange={(e) => {
                          const next = [...quizAnswers];
                          next[i] = e.target.value;
                          setQuizAnswers(next);
                        }}
                        rows={3}
                        placeholder="Answer it straight."
                        className={sharedTextareaClass}
                      />
                    </div>
                  ))}
                  <button
                    onClick={handleSubmitMystery}
                    disabled={loading || quizAnswers.some((a) => a.trim().length === 0)}
                    className={primaryBtn}
                  >
                    {loading ? "Submitting…" : "Submit answers"}
                  </button>
                </div>
              )}

              {mysteryFormat === "one_word_expand" && (
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-3">
                    <input
                      type="text"
                      value={oneWord}
                      onChange={(e) => setOneWord(e.target.value.replace(/\s+/g, ""))}
                      maxLength={30}
                      placeholder="One word."
                      disabled={oneWordRevealed}
                      className="w-full px-4 py-3 bg-[#111111] border border-[#1F1F1F] rounded-md text-[#F0EDEA] placeholder-[#6B6B6B] text-base focus:outline-none focus:border-[#C9A84C] transition-colors disabled:opacity-60"
                    />
                    {!oneWordRevealed && (
                      <button
                        onClick={() => setOneWordRevealed(true)}
                        disabled={oneWord.trim().length === 0}
                        className={primaryBtn}
                      >
                        That&apos;s my word
                      </button>
                    )}
                  </div>
                  {oneWordRevealed && (
                    <div className="flex flex-col gap-3">
                      <label className="text-xs text-[#6B6B6B] uppercase tracking-wide">
                        Now expand on it. Why &ldquo;{oneWord}&rdquo;?
                      </label>
                      <textarea
                        value={receiptText}
                        onChange={(e) => setReceiptText(e.target.value)}
                        rows={6}
                        placeholder="Go deeper."
                        className={sharedTextareaClass}
                        autoFocus
                      />
                      <button
                        onClick={handleSubmitMystery}
                        disabled={loading || receiptText.trim().length === 0}
                        className={primaryBtn}
                      >
                        {loading ? "Submitting…" : "Submit"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {mysteryFormat === "gut_check" && (
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-3">
                    <span className="text-xs text-[#6B6B6B] uppercase tracking-wide">
                      Your rating
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                        <button
                          key={n}
                          onClick={() => setGutRating(n)}
                          className={`w-9 h-9 rounded-md text-sm font-semibold transition-colors ${
                            gutRating === n
                              ? "bg-[#C9A84C] text-[#0A0A0A]"
                              : "bg-[#111111] border border-[#1F1F1F] text-[#6B6B6B] hover:border-[#C9A84C] hover:text-[#C9A84C]"
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                  {gutRating !== null && (
                    <div className="flex flex-col gap-3">
                      <label className="text-xs text-[#6B6B6B] uppercase tracking-wide">
                        Why {gutRating}?
                      </label>
                      <textarea
                        value={receiptText}
                        onChange={(e) => setReceiptText(e.target.value)}
                        rows={5}
                        placeholder="Be honest."
                        className={sharedTextareaClass}
                        autoFocus
                      />
                      <button
                        onClick={handleSubmitMystery}
                        disabled={loading || receiptText.trim().length === 0}
                        className={primaryBtn}
                      >
                        {loading ? "Submitting…" : "Submit"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {mysteryFormat === "draw_a_scene" && (
                <div className="flex flex-col gap-4">
                  <textarea
                    value={receiptText}
                    onChange={(e) => setReceiptText(e.target.value)}
                    rows={7}
                    placeholder="Paint the picture."
                    className={sharedTextareaClass}
                    autoFocus
                  />
                  <button
                    onClick={handleSubmitMystery}
                    disabled={loading || receiptText.trim().length === 0}
                    className={primaryBtn}
                  >
                    {loading ? "Submitting…" : "Submit"}
                  </button>
                </div>
              )}

              <button
                onClick={() => setMysteryActive(false)}
                className="text-xs text-[#6B6B6B] hover:text-[#F0EDEA] transition-colors text-center"
              >
                Back to normal check-in
              </button>
            </>
          )}

          {/* ── QUESTION STAGE ──────────────────────────────────────────── */}
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
                  className={sharedTextareaClass}
                />
              </div>

              {mode === "heavy_day" && question2 && (
                <>
                  <div className="flex flex-col gap-2">
                    <p className="text-lg text-[#F0EDEA] leading-relaxed">
                      {question2}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="answer2"
                      className="text-xs text-[#6B6B6B] uppercase tracking-wide"
                    >
                      Your answer
                    </label>
                    <textarea
                      id="answer2"
                      value={answerText2}
                      onChange={(e) => setAnswerText2(e.target.value)}
                      rows={4}
                      placeholder="Answer it straight."
                      className={sharedTextareaClass}
                    />
                  </div>
                </>
              )}

              <button
                onClick={handleSubmitAnswer}
                disabled={answerDisabled}
                className={primaryBtn}
              >
                {loading ? "Sending..." : "Send it"}
              </button>
            </>
          )}

          {/* ── DONE STAGE ──────────────────────────────────────────────── */}
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

              {(shortModePassEarned || freezeDayEarned) && (
                <div className="flex flex-col gap-2 w-full">
                  {shortModePassEarned && (
                    <div className="px-4 py-2 border border-[#C9A84C]/30 rounded-md">
                      <p className="text-xs text-[#C9A84C]">
                        Short mode pass earned — streak milestone reached.
                      </p>
                    </div>
                  )}
                  {freezeDayEarned && (
                    <div className="px-4 py-2 border border-[#C9A84C]/30 rounded-md">
                      <p className="text-xs text-[#C9A84C]">
                        Freeze day earned — streak milestone reached.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {mode === "pending_review" ? (
                <button
                  onClick={() => router.push(`/check-in/${projectId}`)}
                  className={primaryBtn}
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
