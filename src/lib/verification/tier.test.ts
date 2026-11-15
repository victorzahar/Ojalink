import { describe, expect, it } from "vitest";

import {
  GOOD_HISTORY_DELIVERED_ORDERS,
  TIER_LIMITS,
  computeBuyerTier,
  orderWithinTierLimits,
  orderWithinTierPerOrderCap,
} from "./tier";

const day = 24 * 60 * 60 * 1000;

describe("buyer tiers", () => {
  it("starts new accounts at tier 0 — browse only", () => {
    expect(computeBuyerTier({
      emailVerified: true,
      phoneVerifiedAt: null,
      hasVerifiedIdentity: false,
      deliveredOrderCount: 0,
    })).toBe(0);
  });

  it("requires BOTH email and phone for tier 1", () => {
    expect(computeBuyerTier({
      emailVerified: false,
      phoneVerifiedAt: new Date(),
      hasVerifiedIdentity: false,
      deliveredOrderCount: 0,
    })).toBe(0);
    expect(computeBuyerTier({
      emailVerified: true,
      phoneVerifiedAt: new Date(),
      hasVerifiedIdentity: false,
      deliveredOrderCount: 0,
    })).toBe(1);
  });

  it("reaches tier 2 through a verified identity check", () => {
    expect(computeBuyerTier({
      emailVerified: false,
      phoneVerifiedAt: null,
      hasVerifiedIdentity: true,
      deliveredOrderCount: 0,
    })).toBe(2);
  });

  it("reaches tier 2 through good delivered history without identity", () => {
    expect(computeBuyerTier({
      emailVerified: true,
      phoneVerifiedAt: new Date(Date.now() - day),
      hasVerifiedIdentity: false,
      deliveredOrderCount: GOOD_HISTORY_DELIVERED_ORDERS - 1,
    })).toBe(1);
    expect(computeBuyerTier({
      emailVerified: true,
      phoneVerifiedAt: new Date(Date.now() - day),
      hasVerifiedIdentity: false,
      deliveredOrderCount: GOOD_HISTORY_DELIVERED_ORDERS,
    })).toBe(2);
  });
});

describe("tier order limits", () => {
  it("blocks tier 0 from ordering entirely", () => {
    const result = orderWithinTierLimits(0, 100_00, 0);
    expect(result).toMatchObject({ ok: false, reason: "order_total" });
    expect(orderWithinTierPerOrderCap(0, 100_00)).toBe(false);
  });

  it("caps tier 1 per-order at ₦100,000", () => {
    expect(orderWithinTierLimits(1, 100_000_00, 0)).toMatchObject({ ok: true });
    expect(orderWithinTierLimits(1, 100_000_00 + 1, 0)).toMatchObject({ ok: false, reason: "order_total" });
  });

  it("caps tier 1 weekly at ₦200,000 across orders", () => {
    expect(orderWithinTierLimits(1, 40_000_00, 160_000_00)).toMatchObject({ ok: true });
    expect(orderWithinTierLimits(1, 40_000_00, 160_000_01)).toMatchObject({ ok: false, reason: "weekly_total" });
  });

  it("gives tier 2 the higher limits", () => {
    expect(TIER_LIMITS[2].perOrderKobo).toBe(500_000_00);
    expect(orderWithinTierLimits(2, 500_000_00, 400_000_00)).toMatchObject({ ok: true });
    expect(orderWithinTierLimits(2, 500_000_01, 0)).toMatchObject({ ok: false });
  });
});
