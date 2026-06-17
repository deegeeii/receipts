import { create } from "zustand";

type WorkStyle =
  | "daily_steps"
  | "big_push"
  | "deadline_driven"
  | "needs_watching";

type ProjectSetupState = {
  deposit_amount: number | null;
  daily_payout: number | null;
  duration: "week" | "month";
  title: string;
  description: string;
  start_date: string | null;
  end_date: string | null;
  work_days: number[];
  work_style: WorkStyle | null;
  obstacle_patterns: string[];
  good_day_description: string;
  hard_day_description: string;
  tasks: string[];

  setDeposit: (amount: number) => void;
  setBasics: (fields: {
    title: string;
    description: string;
    start_date: string;
    end_date: string;
    duration: "week" | "month";
  }) => void;
  setWorkDays: (days: number[]) => void;
  setQuiz: (fields: {
    work_style: WorkStyle;
    obstacle_patterns: string[];
  }) => void;
  setDayDescriptions: (fields: {
    good_day_description: string;
    hard_day_description: string;
  }) => void;
  setTasks: (tasks: string[]) => void;
  reset: () => void;
};

const initialState = {
  deposit_amount: null,
  daily_payout: null,
  duration: "week" as const,
  title: "",
  description: "",
  start_date: null,
  end_date: null,
  work_days: [1, 2, 3, 4, 5],
  work_style: null,
  obstacle_patterns: [],
  good_day_description: "",
  hard_day_description: "",
  tasks: [],
};

export const useProjectSetupStore = create<ProjectSetupState>((set, get) => ({
  ...initialState,

  // no longer computes daily_payout — that happens in setWorkDays once duration is known
  setDeposit: (amount) =>
    set({
      deposit_amount: amount,
      daily_payout: null,
    }),

  setBasics: (fields) => set(fields),

  // computes daily_payout from deposit_amount + duration (5 days/week, 20 days/month)
  setWorkDays: (days) => {
    const { deposit_amount, duration } = get();
    const totalWorkDays = duration === "week" ? 5 : 20;
    const daily_payout = deposit_amount
      ? Math.round(deposit_amount / totalWorkDays)
      : null;
    set({ work_days: days, daily_payout });
  },

  setQuiz: (fields) => set(fields),

  setDayDescriptions: (fields) => set(fields),

  setTasks: (tasks) => set({ tasks }),

  reset: () => set(initialState),
}));
