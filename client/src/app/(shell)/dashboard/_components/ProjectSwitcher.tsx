"use client";

import { useState } from "react";
import Link from "next/link";
import TaskList from "./TaskList";

type Task = {
  id: string;
  title: string;
  completed: boolean;
};

type Project = {
  id: string;
  title: string;
  deposit_amount: number;
  daily_payout: number;
  end_date: string;
  checkedInToday: boolean;
  tasks: Task[];
};

type ProjectSwitcherProps = {
  projects: Project[];
};

function formatCents(cents: number): string {
  return `$${(cents / 100).toLocaleString()}`;
}

function daysRemaining(endDate: string): number {
  const end = new Date(endDate);
  const today = new Date();
  const diff = end.getTime() - today.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// ProjectSwitcher — pill selector across active projects (gold = receipt due, green = receipt logged), shows selected project's detail card, check-in CTA, and roadmap
export default function ProjectSwitcher({ projects }: ProjectSwitcherProps) {
  const [selectedId, setSelectedId] = useState(projects[0].id);

  const selected = projects.find((project) => project.id === selectedId) ?? projects[0];

  return (
    <div className="flex flex-col gap-5">

      <div className="flex flex-wrap gap-2">
        {projects.map((project) => {
          const isSelected = project.id === selectedId;

          const statusColor = project.checkedInToday
            ? "border-[#2D6A4F] text-[#2D6A4F]"
            : "border-[#C9A84C] text-[#C9A84C]";

          const backgroundColor = isSelected
            ? "bg-[#111111]"
            : "bg-transparent";

          return (
            <button
              key={project.id}
              onClick={() => setSelectedId(project.id)}
              className={`px-4 py-2 rounded-md text-sm font-semibold border transition-colors ${statusColor} ${backgroundColor}`}
            >
              {project.title}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-5">

        <div className="flex flex-col gap-3 px-5 py-5 bg-[#111111] border border-[#1F1F1F] rounded-md">
          <div className="flex justify-between items-baseline">
            <span className="text-lg font-semibold text-[#F0EDEA]">
              {selected.title}
            </span>
            <span className="text-xs text-[#6B6B6B]">
              {daysRemaining(selected.end_date)} days left
            </span>
          </div>

          <div className="flex justify-between items-baseline">
            <span className="text-xs text-[#6B6B6B] uppercase tracking-wide">
              Deposit
            </span>
            <span className="text-sm font-semibold text-[#C9A84C]">
              {formatCents(selected.deposit_amount)}
            </span>
          </div>

          <div className="flex justify-between items-baseline">
            <span className="text-xs text-[#6B6B6B] uppercase tracking-wide">
              Daily payout
            </span>
            <span className="text-sm font-semibold text-[#F0EDEA]">
              {formatCents(selected.daily_payout)}
            </span>
          </div>
        </div>

        {selected.checkedInToday ? (
          <div className="text-center py-4 border border-[#1F1F1F] rounded-md">
            <span className="text-sm text-[#2D6A4F] font-semibold">
              Receipt logged. See you tomorrow.
            </span>
          </div>
        ) : (
          <Link
            href={`/check-in/${selected.id}`}
            className="w-full py-4 bg-[#C9A84C] text-[#0A0A0A] font-semibold text-base rounded-md tracking-wide text-center hover:bg-[#E5C97A] transition-colors"
          >
            Drop your receipt
          </Link>
        )}

        {selected.tasks.length > 0 && (
          <TaskList
            key={selected.id}
            tasks={selected.tasks}
            locked={selected.checkedInToday}
          />
        )}


      </div>

    </div>
  );
}

