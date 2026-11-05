import { describe, expect, it } from "vitest";
import { summarisePayouts } from "@/lib/orders/payout-summary";

function row(
  status: string,
  subtotalKobo: number,
  platformFeeKobo: number,
  refundKobo: number,
  deliveredAt: string | null,
) {
  return {
    status,
    subtotalKobo,
    platformFeeKobo,
    refundKobo,
    deliveredAt: deliveredAt ? new Date(deliveredAt) : null,
  };
}

describe("summarisePayouts", () => {
  it("groups earned orders by Lagos week, newest first", () => {
    const result = summarisePayouts([
      // 00:30 Monday 26 Oct Lagos: belongs to the week of 26 Oct
      row("delivered", 100000, 5000, 0, "2026-10-25T23:30:00Z"),
      // 23:59:59 Sunday 25 Oct Lagos: belongs to the week of 19 Oct
      row("delivered", 50000, 2500, 10000, "2026-10-25T22:59:59Z"),
      row("delivered", 20000, 1000, 0, "2026-10-28T10:00:00Z"),
    ]);

    expect(result.weeks).toEqual([
      { weekStart: "2026-10-26", earnedKobo: 114000, orderCount: 2 },
      { weekStart: "2026-10-19", earnedKobo: 37500, orderCount: 1 },
    ]);
  });

  it("adds paid, accepted and picked_up orders to pending", () => {
    const result = summarisePayouts([
      row("paid", 30000, 1500, 0, null),
      row("accepted", 10000, 500, 0, null),
      row("picked_up", 20000, 1000, 0, null),
    ]);

    expect(result.pendingKobo).toBe(57000);
    expect(result.weeks).toEqual([]);
  });

  it("counts nothing for pending, rejected, cancelled and refunded", () => {
    const result = summarisePayouts([
      row("pending", 30000, 1500, 0, null),
      row("rejected", 30000, 1500, 0, null),
      row("cancelled", 30000, 1500, 0, null),
      row("refunded", 30000, 1500, 30000, "2026-10-28T10:00:00Z"),
    ]);

    expect(result.pendingKobo).toBe(0);
    expect(result.weeks).toEqual([]);
  });

  it("skips a delivered order that has no delivered_at", () => {
    const result = summarisePayouts([row("delivered", 30000, 1500, 0, null)]);
    expect(result.weeks).toEqual([]);
  });
});
