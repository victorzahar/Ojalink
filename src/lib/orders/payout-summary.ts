import { lagosWeekStart, orderPayoutKobo } from "@/lib/orders/payout-week";

export type PayoutOrderRow = {
  status: string;
  subtotalKobo: number;
  platformFeeKobo: number;
  refundKobo: number;
  deliveredAt: Date | null;
};

export type WeekSummary = {
  weekStart: string;
  earnedKobo: number;
  orderCount: number;
};

const PENDING_STATUSES = ["paid", "accepted", "picked_up"];

// Delivered orders are earned (grouped by Lagos week of delivered_at).
// Paid, accepted and picked_up orders are pending.
// Every other status counts as nothing.
export function summarisePayouts(rows: PayoutOrderRow[]) {
  const weeks = new Map<string, WeekSummary>();
  let pendingKobo = 0;

  for (const row of rows) {
    const amount = orderPayoutKobo(row);

    if (row.status === "delivered") {
      if (!row.deliveredAt) continue; // cannot place it in a week
      const weekStart = lagosWeekStart(row.deliveredAt);
      const week = weeks.get(weekStart) ?? {
        weekStart,
        earnedKobo: 0,
        orderCount: 0,
      };
      week.earnedKobo += amount;
      week.orderCount += 1;
      weeks.set(weekStart, week);
    } else if (PENDING_STATUSES.includes(row.status)) {
      pendingKobo += amount;
    }
  }

  const sortedWeeks = [...weeks.values()].sort((a, b) =>
    b.weekStart.localeCompare(a.weekStart),
  );

  return { weeks: sortedWeeks, pendingKobo };
}
