// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const XP_CURVE_COEFFICIENT = 12.4;

// ── TYPES ─────────────────────────────────────────────────────────────────────
export type LevelGroup = {
  name: string;
  minLevel: number;
  maxLevel: number | null;
};

// ── DATA ──────────────────────────────────────────────────────────────────────
export const LEVEL_GROUPS: LevelGroup[] = [
  { name: "Freshman",  minLevel: 1,   maxLevel: 5   },
  { name: "Sophomore", minLevel: 6,   maxLevel: 15  },
  { name: "Junior",    minLevel: 16,  maxLevel: 30  },
  { name: "Graduate",  minLevel: 31,  maxLevel: 51  },
  { name: "Builder",   minLevel: 52,  maxLevel: 77  },
  { name: "Mogul",     minLevel: 78,  maxLevel: 108 },
  { name: "Legend",    minLevel: 109, maxLevel: null },
];

// ── HELPERS ───────────────────────────────────────────────────────────────────
export function cumulativeXpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.round(XP_CURVE_COEFFICIENT * (level - 1) ** 2);
}

export function getLevelForXp(totalXp: number): number {
  let level = 1;
  while (cumulativeXpForLevel(level + 1) <= totalXp) {
    level += 1;
  }
  return level;
}

export function getLevelGroup(level: number): string {
  const group = LEVEL_GROUPS.find(
    (g) => level >= g.minLevel && (g.maxLevel === null || level <= g.maxLevel)
  );
  return group ? group.name : "Legend";
}
