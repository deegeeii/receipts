const BASE_XP = 5;
const PAYOUT_BONUS_RATE = 0.3;

function getDepositTierMultiplier(depositAmountCents: number): number {
  if (depositAmountCents <= 5000) return 1;
  if (depositAmountCents <= 10000) return 1.5;
  if (depositAmountCents <= 25000) return 2.5;
  if (depositAmountCents <= 50000) return 3.5;
  return 5;
}

function getStreakMultiplier(streakDays: number): number {
  if (streakDays <= 5) return 1;
  if (streakDays <= 10) return 2;
  if (streakDays <= 15) return 3;
  if (streakDays <= 20) return 4;
  if (streakDays <= 25) return 5;
  return 6;
}

type CalculateXpParams = {
  depositAmountCents: number;
  dailyPayoutCents: number;
  streakDays: number;
};

export function calculateXp({
  depositAmountCents,
  dailyPayoutCents,
  streakDays,
}: CalculateXpParams): number {
  const depositTierMultiplier = getDepositTierMultiplier(depositAmountCents);
  const streakMultiplier = getStreakMultiplier(streakDays);
  const payoutBonus = dailyPayoutCents * PAYOUT_BONUS_RATE;

  const xp =
    BASE_XP * depositTierMultiplier * streakMultiplier + payoutBonus;

  return Math.round(xp);
}
