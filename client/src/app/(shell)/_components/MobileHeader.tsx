"use client";

// ── IMPORTS ───────────────────────────────────────────────────────────────────
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const SETTINGS_LINKS = [
  { label: "Crew", href: "/crew", description: "Your buddies and leaderboard" },
  { label: "Profile", href: "/profile", description: "Stats, payouts, and privacy" },
  { label: "Voice", href: "/settings/voice", description: "AI personality" },
];

// ── COMPONENT ─────────────────────────────────────────────────────────────────
export default function MobileHeader() {
  const pathname = usePathname();

  // ── STATE ───────────────────────────────────────────────────────────────────
  const [open, setOpen] = useState(false);

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Top bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#0A0A0A] border-b border-[#1F1F1F] flex items-center justify-between px-5 h-14">
        <span className="text-base font-bold text-[#C9A84C] tracking-wide">
          Receipt
        </span>
        <button
          onClick={() => setOpen(true)}
          className="w-10 h-10 flex flex-col items-center justify-center gap-1.5"
          aria-label="Open settings"
        >
          <span className="w-5 h-px bg-[#6B6B6B]" />
          <span className="w-5 h-px bg-[#6B6B6B]" />
          <span className="w-3 h-px bg-[#6B6B6B]" />
        </button>
      </header>

      {/* Settings overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 bg-[#0A0A0A] flex flex-col">

          <div className="flex items-center justify-between px-5 h-14 border-b border-[#1F1F1F]">
            <span className="text-base font-bold text-[#C9A84C] tracking-wide">
              Receipt
            </span>
            <button
              onClick={() => setOpen(false)}
              className="w-10 h-10 flex items-center justify-center text-[#6B6B6B] hover:text-[#F0EDEA] transition-colors"
              aria-label="Close settings"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M1 1l16 16M17 1L1 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          <nav className="flex flex-col gap-2 px-5 py-8">
            {SETTINGS_LINKS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex flex-col gap-0.5 px-5 py-4 rounded-md border transition-colors ${
                    isActive
                      ? "border-[#C9A84C]/40 bg-[#C9A84C]/5"
                      : "border-[#1F1F1F] bg-[#111111] hover:border-[#C9A84C]/30"
                  }`}
                >
                  <span className={`text-base font-semibold ${isActive ? "text-[#C9A84C]" : "text-[#F0EDEA]"}`}>
                    {item.label}
                  </span>
                  <span className="text-sm text-[#6B6B6B]">
                    {item.description}
                  </span>
                </Link>
              );
            })}
          </nav>

        </div>
      )}
    </>
  );
}
