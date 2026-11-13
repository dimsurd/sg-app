/** Same thresholds as the admin dashboard (see sg-api reports.ts). */
export const LOW_BALANCE_MINUTES = 120;

export function balanceFlag(b: { remainingMinutes: number; availableMinutes: number }): "ok" | "low" | "out" {
  if (b.remainingMinutes <= 0) return "out";
  if (b.remainingMinutes <= LOW_BALANCE_MINUTES || b.availableMinutes <= 0) return "low";
  return "ok";
}
