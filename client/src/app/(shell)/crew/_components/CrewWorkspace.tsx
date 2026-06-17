"use client";

import { useState } from "react";
import { getLevelGroup } from "@/lib/xp/levels";

type Buddy = {
  id: string;
  name: string | null;
  level: number;
  current_streak: number;
};

type CrewWorkspaceProps = {
  inviteCode: string;
  initialBuddies: Buddy[];
};

// CrewWorkspace — invite code with copy button, redeem-a-code form, and buddy list (level, level group, streak)
export default function CrewWorkspace({
  inviteCode,
  initialBuddies,
}: CrewWorkspaceProps) {
  const [buddies, setBuddies] = useState<Buddy[]>(initialBuddies);
  const [redeemCode, setRedeemCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    if (!trimmed) {
      return;
    }

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

  return (
    <div className="flex flex-col gap-8">

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
