"use client";

// ── IMPORTS ───────────────────────────────────────────────────────────────────
import { useState } from "react";
import { getLevelGroup } from "@/lib/xp/levels";

// ── TYPES ─────────────────────────────────────────────────────────────────────
type Buddy = {
  id: string;
  name: string | null;
  level: number;
  current_streak: number;
};

type Props = {
  inviteCode: string;
  initialBuddies: Buddy[];
  currentUser: Buddy;
};

// ── COMPONENT ─────────────────────────────────────────────────────────────────
export default function CrewWorkspace({
  inviteCode,
  initialBuddies,
  currentUser,
}: Props) {

  // ── STATE ───────────────────────────────────────────────────────────────────
  const [buddies, setBuddies] = useState<Buddy[]>(initialBuddies);
  const [redeemCode, setRedeemCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matchSuggestion, setMatchSuggestion] = useState<{
    id: string;
    name: string | null;
    level: number;
    current_streak: number;
    invite_code: string;
  } | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchAdding, setMatchAdding] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);


  // ── HANDLERS ────────────────────────────────────────────────────────────────
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (copyError) {
      console.error("crew: copy failed", copyError);
      setError("Failed to copy code");
    }
  }

  async function handleRedeem() {
    const trimmed = redeemCode.trim();
    if (!trimmed) return;

    setRedeeming(true);
    setError(null);

    const response = await fetch("/api/crew/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: trimmed }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("crew: redeem failed", data);
      setError(data.error ?? "Failed to redeem code");
      setRedeeming(false);
      return;
    }

    if (data.buddy) {
      setBuddies((current) => [...current, data.buddy]);
    }

    setRedeemCode("");
    setRedeeming(false);
  }

  async function handleFindMatch() {
    setMatchLoading(true);
    setMatchError(null);
    setMatchSuggestion(null);

    const response = await fetch("/api/crew/match", { method: "POST" });
    const data = await response.json();

    if (!response.ok) {
      console.error("crew: match failed", data);
      setMatchError(data.error ?? "No matches found right now.");
      setMatchLoading(false);
      return;
    }

    if (!data.match) {
      setMatchError("No matches found at your level right now. Check back soon.");
      setMatchLoading(false);
      return;
    }

    setMatchSuggestion(data.match);
    setMatchLoading(false);
  }

  async function handleAddMatch() {
    if (!matchSuggestion) return;
    setMatchAdding(true);
    setMatchError(null);

    const response = await fetch("/api/crew/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: matchSuggestion.invite_code }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("crew: add match failed", data);
      setMatchError(data.error ?? "Failed to add match.");
      setMatchAdding(false);
      return;
    }

    if (data.buddy) {
      setBuddies((current) => [...current, data.buddy]);
    }

    setMatchSuggestion(null);
    setMatchAdding(false);
  }


  // ── RENDER ──────────────────────────────────────────────────────────────────
  const leaderboard = [currentUser, ...buddies].sort(
    (a, b) => b.current_streak - a.current_streak
  );

  return (
    <div className="flex flex-col gap-10">

      {/* Leaderboard */}
      {leaderboard.length > 1 && (
        <div className="flex flex-col gap-3">
          <span className="text-xs text-[#6B6B6B] uppercase tracking-wide">
            Crew leaderboard
          </span>
          <div className="flex flex-col gap-2">
            {leaderboard.map((member, index) => {
              const isMe = member.id === currentUser.id;
              return (
                <div
                  key={member.id}
                  className={`flex items-center gap-4 px-5 py-4 rounded-md border ${
                    isMe
                      ? "bg-[#C9A84C]/5 border-[#C9A84C]/40"
                      : "bg-[#111111] border-[#1F1F1F]"
                  }`}
                >
                  <span
                    className={`text-sm font-bold w-5 text-right ${
                      isMe ? "text-[#C9A84C]" : "text-[#6B6B6B]"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <div className="flex-1 flex justify-between items-center">
                    <span className={`text-sm font-semibold ${isMe ? "text-[#C9A84C]" : "text-[#F0EDEA]"}`}>
                      {member.name ?? "Anonymous"}
                      {isMe && (
                        <span className="ml-2 text-xs font-normal text-[#C9A84C]/60">
                          you
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-[#6B6B6B]">
                      {member.current_streak} day streak · Lv {member.level}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

            {/* Accountability match */}
            <div className="flex flex-col gap-3">
        <span className="text-xs text-[#6B6B6B] uppercase tracking-wide">
          Accountability match
        </span>

        {!matchSuggestion && (
          <button
            onClick={handleFindMatch}
            disabled={matchLoading}
            className="w-full py-3 bg-[#111111] border border-[#1F1F1F] text-[#6B6B6B] text-sm font-semibold rounded-md hover:border-[#C9A84C] hover:text-[#C9A84C] disabled:opacity-40 transition-colors"
          >
            {matchLoading ? "Looking…" : "Find a match"}
          </button>
        )}

        {matchSuggestion && (
          <div className="flex flex-col gap-4 px-5 py-4 bg-[#111111] border border-[#1F1F1F] rounded-md">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-[#F0EDEA]">
                {matchSuggestion.name ?? "Anonymous"}
              </span>
              <span className="text-xs text-[#6B6B6B]">
                Level {matchSuggestion.level} · {matchSuggestion.current_streak} day streak
              </span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setMatchSuggestion(null)}
                className="flex-1 py-3 border border-[#1F1F1F] text-[#6B6B6B] text-sm font-semibold rounded-md hover:border-[#C9A84C] transition-colors"
              >
                Pass
              </button>
              <button
                onClick={handleAddMatch}
                disabled={matchAdding}
                className="flex-1 py-3 bg-[#C9A84C] text-[#0A0A0A] text-sm font-semibold rounded-md hover:bg-[#E5C97A] disabled:opacity-40 transition-colors"
              >
                {matchAdding ? "Adding…" : "Add them"}
              </button>
            </div>
          </div>
        )}

        {matchError && (
          <p className="text-sm text-[#7B2D2D]">{matchError}</p>
        )}
      </div>


      {/* Invite code */}
      <div className="flex flex-col gap-3">
        <span className="text-xs text-[#6B6B6B] uppercase tracking-wide">
          Your invite code
        </span>
        <div className="flex gap-2">
          <span className="flex-1 px-4 py-3 bg-[#111111] border border-[#1F1F1F] rounded-md text-[#F0EDEA] text-sm font-mono tracking-wide">
            {inviteCode}
          </span>
          <button
            onClick={handleCopy}
            className="px-5 py-3 border border-[#1F1F1F] text-[#F0EDEA] font-semibold text-sm rounded-md hover:border-[#C9A84C] transition-colors"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      {/* Add a buddy */}
      <div className="flex flex-col gap-3">
        <span className="text-xs text-[#6B6B6B] uppercase tracking-wide">
          Add a buddy
        </span>
        <div className="flex gap-2">
          <input
            type="text"
            value={redeemCode}
            onChange={(e) => setRedeemCode(e.target.value)}
            placeholder="Enter their invite code"
            className="flex-1 px-4 py-3 bg-[#111111] border border-[#1F1F1F] rounded-md text-[#F0EDEA] placeholder-[#6B6B6B] text-sm focus:outline-none focus:border-[#C9A84C] transition-colors"
          />
          <button
            onClick={handleRedeem}
            disabled={redeeming || !redeemCode.trim()}
            className="px-5 py-3 bg-[#C9A84C] text-[#0A0A0A] font-semibold text-sm rounded-md hover:bg-[#E5C97A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {redeeming ? "Adding..." : "Add"}
          </button>
        </div>
        {error && (
          <p className="text-sm text-[#7B2D2D]">{error}</p>
        )}
      </div>
            {/* Buddy list */}
            <div className="flex flex-col gap-3">
        <span className="text-xs text-[#6B6B6B] uppercase tracking-wide">
          Your buddies
        </span>
        {buddies.length === 0 ? (
          <p className="text-sm text-[#6B6B6B]">
            No buddies yet. Share your code or redeem one above.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {buddies.map((buddy) => (
              <div
                key={buddy.id}
                className="flex justify-between items-center px-5 py-4 bg-[#111111] border border-[#1F1F1F] rounded-md"
              >
                <span className="text-sm font-semibold text-[#F0EDEA]">
                  {buddy.name ?? "Anonymous"}
                </span>
                <span className="text-xs text-[#6B6B6B] uppercase tracking-wide">
                  Level {buddy.level} · {getLevelGroup(buddy.level)} · {buddy.current_streak} day streak
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

