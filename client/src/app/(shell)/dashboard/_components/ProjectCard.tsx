// ── IMPORTS ───────────────────────────────────────────────────────────────────
"use client";

import Link from "next/link";

// ── TYPES ─────────────────────────────────────────────────────────────────────
type Task = {
  id: string;
  title: string;
  completed: boolean;
};

type Props = {
  id: string;
  title: string;
  deposit_amount: number;
  daily_payout: number;
  end_date: string;
  remaining_balance: number;
  checkedInToday: boolean;
  streak: number;
  tasks: Task[];
  today: string;
};

// ── HELPERS ───────────────────────────────────────────────────────────────────
function formatCents(cents: number): string {
  return `$${(cents / 100).toLocaleString()}`;
}

function daysLeft(endDate: string, today: string): number {
  const end = new Date(`${endDate}T00:00:00Z`);
  const now = new Date(`${today}T00:00:00Z`);
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

// ── COMPONENT ─────────────────────────────────────────────────────────────────
export default function ProjectCard({
  id,
  title,
  deposit_amount,
  daily_payout,
  end_date,
  remaining_balance,
  checkedInToday,
  streak,
  tasks,
  today,
}: Props) {

  // ── RENDER ──────────────────────────────────────────────────────────────────
  const days = daysLeft(end_date, today);

  return (
    <div className="flex flex-col gap-6 px-5 py-6 bg-[#111111] border border-[#1F1F1F] rounded-md">

      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-semibold text-[#F0EDEA] leading-tight">
          {title}
        </h2>
        {checkedInToday ? (
          <span className="shrink-0 text-xs font-semibold text-[#2D6A4F] border border-[#2D6A4F]/40 px-2 py-1 rounded-md">
            Logged
          </span>
        ) : (
          <Link
            href={`/check-in/${id}`}
            className="shrink-0 text-xs font-semibold text-[#0A0A0A] bg-[#C9A84C] px-3 py-1 rounded-md hover:bg-[#E5C97A] transition-colors"
          >
            Drop receipt
          </Link>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Remaining" value={formatCents(remaining_balance)} gold />
        <Stat label="Days left" value={String(days)} />
        <Stat label="Streak" value={`${streak}d`} />
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs text-[#6B6B6B]">
        <div className="flex flex-col gap-0.5">
          <span className="uppercase tracking-wide">Deposit</span>
          <span className="text-[#F0EDEA] font-semibold text-sm">
            {formatCents(deposit_amount)}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="uppercase tracking-wide">Daily payout</span>
          <span className="text-[#F0EDEA] font-semibold text-sm">
            {formatCents(daily_payout)}
          </span>
        </div>
      </div>

      {tasks.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs text-[#6B6B6B] uppercase tracking-wide">
            Roadmap
          </span>
          <div className="flex flex-col gap-1.5">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-2"
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    task.completed ? "bg-[#2D6A4F]" : "bg-[#1F1F1F]"
                  }`}
                />
                <span
                  className={`text-sm ${
                    task.completed
                      ? "text-[#6B6B6B] line-through"
                      : "text-[#F0EDEA]"
                  }`}
                >
                  {task.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Link
        href={`/projects/${id}/history`}
        className="text-xs text-[#6B6B6B] hover:text-[#C9A84C] transition-colors text-center"
      >
        View full history →
      </Link>

    </div>
  );
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
function Stat({
  label,
  value,
  gold,
}: {
  label: string;
  value: string;
  gold?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5 items-center text-center px-3 py-3 bg-[#0A0A0A] rounded-md">
      <span className="text-[10px] text-[#6B6B6B] uppercase tracking-wide">
        {label}
      </span>
      <span
        className={`text-base font-bold ${
          gold ? "text-[#C9A84C]" : "text-[#F0EDEA]"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
