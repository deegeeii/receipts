"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  label: string;
  href: string;
};

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
  },
  {
    label: "Projects",
    href: "/projects",
  },
  {
    label: "Ideation",
    href: "/ideation",
  },
  {
    label: "Journal",
    href: "/journal",
  },
  {
    label: "Crew",
    href: "/crew",
  },
];



// Sidebar — persistent left navigation for the authenticated app shell
export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="w-56 shrink-0 min-h-screen bg-[#0A0A0A] border-r border-[#1F1F1F] px-4 py-8 flex flex-col gap-8"
    >
      <span className="text-lg font-bold text-[#C9A84C] tracking-wide px-2">
        Receipt
      </span>

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;

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
      </nav>
    </aside>
  );
}
