// Lagos is UTC+1 all year (no daylight saving).
const LAGOS_OFFSET_MS = 60 * 60 * 1000;

// Returns the Monday of the Lagos week as "YYYY-MM-DD".
export function lagosWeekStart(date: Date): string {
  const lagos = new Date(date.getTime() + LAGOS_OFFSET_MS);
  const daysSinceMonday = (lagos.getUTCDay() + 6) % 7;
  lagos.setUTCDate(lagos.getUTCDate() - daysSinceMonday);
  return lagos.toISOString().slice(0, 10);
}

// Payout for one order, in whole kobo. Never below 0.
// The delivery fee is not part of it.
export function orderPayoutKobo(order: {
  subtotalKobo: number;
  platformFeeKobo: number;
  refundKobo: number | null;
}): number {
  return Math.max(
    0,
    order.subtotalKobo - order.platformFeeKobo - (order.refundKobo ?? 0),
  );
}
