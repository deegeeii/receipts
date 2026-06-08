import { create } from "zustand";

type WorkStyle =
  | "daily_steps"
  | "big_push"
  | "deadline_driven"
  | "needs_watching";

type ProjectSetupState = {
  deposit_amount: number | null;
  daily_payout: number | null;
  title: string;
  description: string;
  start_date: string | null;
  end_date: string | null;
  work_style: WorkStyle | null;
  obstacle_patterns: string[];
  good_day_description: string;
  hard_day_description: string;

  setDeposit: (amount: number) => void;
  setBasics: (fields: {
    title: string;
    description: string;
    start_date: string;
    end_date: string;
  }) => void;
  setQuiz: (fields: {
    work_style: WorkStyle;
    obstacle_patterns: string[];
  }) => void;
  setDayDescriptions: (fields: {
    good_day_description: string;
    hard_day_description: string;
  }) => void;
  reset: () => void;
};

const initialState = {
  deposit_amount: null,
  daily_payout: null,
  title: "",
  description: "",
  start_date: null,
  end_date: null,
  work_style: null,
  obstacle_patterns: [],
  good_day_description: "",
  hard_day_description: "",
};

export const useProjectSetupStore = create<ProjectSetupState>((set) => ({
  ...initialState,

  setDeposit: (amount) =>
    set({
      deposit_amount: amount,
      daily_payout: Math.round(amount / 7),
    }),

  setBasics: (fields) => set(fields),

  setQuiz: (fields) => set(fields),

  setDayDescriptions: (fields) => set(fields),

  reset: () => set(initialState),
}));
