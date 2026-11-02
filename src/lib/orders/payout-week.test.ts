import { describe, expect, it } from "vitest";
import { lagosWeekStart, orderPayoutKobo } from "@/lib/orders/payout-week";

describe("lagosWeekStart", () => {
  it("puts 00:30 Monday 26 Oct Lagos time in the week of 26 Oct", () => {
    // 00:30 Lagos = 23:30 UTC on Sunday 25 Oct
    expect(lagosWeekStart(new Date("2026-10-25T23:30:00Z"))).toBe("2026-10-26");
  });

  it("keeps 23:59 Sunday 25 Oct Lagos time in the week before", () => {
    expect(lagosWeekStart(new Date("2026-10-25T22:59:59Z"))).toBe("2026-10-19");
  });

  it("gives the same Monday for a Wednesday", () => {
    expect(lagosWeekStart(new Date("2026-10-28T10:00:00Z"))).toBe("2026-10-26");
  });
});

describe("orderPayoutKobo", () => {
  it("is subtotal minus fee minus refund", () => {
    expect(
      orderPayoutKobo({ subtotalKobo: 100000, platformFeeKobo: 5000, refundKobo: 20000 }),
    ).toBe(75000);
  });

  it("treats a missing refund as 0", () => {
    expect(
      orderPayoutKobo({ subtotalKobo: 100000, platformFeeKobo: 5000, refundKobo: null }),
    ).toBe(95000);
  });

  it("never goes below 0", () => {
    expect(
      orderPayoutKobo({ subtotalKobo: 10000, platformFeeKobo: 500, refundKobo: 50000 }),
    ).toBe(0);
  });
});
