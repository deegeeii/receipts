// ── IMPORTS ───────────────────────────────────────────────────────────────────
"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

// ── TYPES ─────────────────────────────────────────────────────────────────────
type NavItem = {
  label: string;
  href: string;
};

type ActiveProject = {
  id: string;
  title: string;
  checked_in_today: boolean;
};

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Projects", href: "/projects" },
  { label: "Ideation", href: "/ideation" },
  { label: "Journal", href: "/journal" },
  { label: "Crew", href: "/crew" },
];

// ── COMPONENT ─────────────────────────────────────────────────────────────────
export default function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedProjectId = searchParams.get("project");

  // ── STATE ───────────────────────────────────────────────────────────────────
  const [projects, setProjects] = useState<ActiveProject[]>([]);

  // ── EFFECTS ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function fetchProjects() {
      const res = await fetch("/api/projects/active");
      if (!res.ok) return;
      const data = await res.json();
      setProjects(data.projects ?? []);
    }

    fetchProjects();
  }, [pathname]);

  // ── RENDER ──────────────────────────────────────────────────────────────────
  const navLinks = (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.href === "/dashboard"
            ? pathname === "/dashboard" || pathname.startsWith("/dashboard")
            : pathname === item.href;

        return (
          <Link
            key={item.label}
            href={item.href}
            className={`px-3 py-2 rounded-md text-sm transition-colors ${
              isActive
                ? "bg-[#111111] text-[#F0EDEA] font-semibold"
                : "text-[#6B6B6B] hover:text-[#F0EDEA] hover:bg-[#111111]"
            }`}
          >
            {item.label}
          </Link>
        );
      })}

      {projects.length > 0 && (
        <div className="flex flex-col gap-1 mt-2 pt-2 border-t border-[#1F1F1F]">
          {projects.map((project) => {
            const isSelected = selectedProjectId === project.id;
            return (
              <Link
                key={project.id}
                href={`/dashboard?project=${project.id}`}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                  isSelected
                    ? "bg-[#111111] text-[#F0EDEA] font-semibold"
                    : "text-[#6B6B6B] hover:text-[#F0EDEA] hover:bg-[#111111]"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    project.checked_in_today
                      ? "bg-[#2D6A4F]"
                      : "bg-[#C9A84C]"
                  }`}
                />
                <span className="truncate">{project.title}</span>
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 shrink-0 min-h-screen bg-[#0A0A0A] border-r border-[#1F1F1F] px-4 py-8 flex-col gap-8">
        <span className="text-lg font-bold text-[#C9A84C] tracking-wide px-2">
          Receipt
        </span>
        {navLinks}
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0A0A0A] border-t border-[#1F1F1F] flex">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center py-3 text-[10px] tracking-wide transition-colors ${
                isActive
                  ? "text-[#C9A84C] font-semibold"
                  : "text-[#6B6B6B] hover:text-[#F0EDEA]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
