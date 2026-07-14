// ── TYPES ─────────────────────────────────────────────────────────────────────
export type CreateProjectState = {
    deposit_amount: number | null;
    title: string;
    description: string;
    duration: "week" | "month";
    start_date: string;
    end_date: string;
    work_days: number[];
    daily_payout: number | null;
    work_style: string | null;
    obstacle_patterns: string[];
    good_day_description: string;
    hard_day_description: string;
    tasks: string[];
  };
  
  // ── STORE ─────────────────────────────────────────────────────────────────────
  const defaultState: CreateProjectState = {
    deposit_amount: null,
    title: "",
    description: "",
    duration: "week",
    start_date: "",
    end_date: "",
    work_days: [1, 2, 3, 4, 5],
    daily_payout: null,
    work_style: null,
    obstacle_patterns: [],
    good_day_description: "",
    hard_day_description: "",
    tasks: [],
  };
  
  let state: CreateProjectState = { ...defaultState };
  
  export const createProjectStore = {
    get: (): CreateProjectState => state,
    set: (partial: Partial<CreateProjectState>) => {
      state = { ...state, ...partial };
    },
    reset: () => {
      state = { ...defaultState };
    },
  };
  