import { getLevelGroup } from "@/lib/xp/levels";

// ── TYPES ─────────────────────────────────────────────────────────────────────
export type CheckInMode =
  | "receipt"
  | "weekly_review"
  | "pending_review"
  | "rest_day"
  | "light_day"
  | "heavy_day";

// ── HELPERS ───────────────────────────────────────────────────────────────────
function getCurrentWorkWeekStart(
  dateString: string,
  workDays: number[]
): string {
  const today = new Date(`${dateString}T00:00:00Z`);
  for (let i = 0; i <= 7; i++) {
    const d = new Date(today);
    d.setUTCDate(today.getUTCDate() - i);
    if (!workDays.includes(d.getUTCDay())) continue;
    const dayBefore = new Date(d);
    dayBefore.setUTCDate(d.getUTCDate() - 1);
    if (!workDays.includes(dayBefore.getUTCDay())) {
      return d.toISOString().slice(0, 10);
    }
  }
  return dateString;
}

// ── MODE ──────────────────────────────────────────────────────────────────────
export function getCheckInMode(
  level: number,
  dateString: string,
  workDays: number[],
  lastWeeklyReviewDate: string | null,
  projectStartDate: string
): CheckInMode {
  const hasWeeklyReview = getLevelGroup(level) !== "Freshman";
  const todayDayOfWeek = new Date(`${dateString}T00:00:00Z`).getUTCDay();
  const isWorkDay = workDays.includes(todayDayOfWeek);
  const currentWorkWeekStart = getCurrentWorkWeekStart(dateString, workDays);

  const reviewAlreadyDoneThisWeek =
    lastWeeklyReviewDate !== null &&
    lastWeeklyReviewDate >= currentWorkWeekStart;

  const reviewIsPending =
    isWorkDay &&
    hasWeeklyReview &&
    !reviewAlreadyDoneThisWeek &&
    (lastWeeklyReviewDate !== null
      ? lastWeeklyReviewDate < currentWorkWeekStart
      : projectStartDate < currentWorkWeekStart);

  if (reviewIsPending) return "pending_review";

  if (!isWorkDay) {
    if (hasWeeklyReview && !reviewAlreadyDoneThisWeek) return "weekly_review";
    return "rest_day";
  }

  // Junior+ (level 16+) gets tiered day types instead of plain receipt
  if (level >= 16 && workDays.length > 0) {
    const peakDay = Math.max(...workDays);
    return todayDayOfWeek === peakDay ? "heavy_day" : "light_day";
  }

  return "receipt";
}
