/**
 * Buyer verification tiers (Nigeria).
 *
 * Tier 0 — new sign-up: browse only, no ordering.
 * Tier 1 — email verified + phone verified by OTP: limited ordering.
 * Tier 2 — identity (NIN) verified through a provider, or a good delivered
 *          order history: higher limits.
 *
 * The tier is always computed from live facts (user columns, verified
 * identity_verifications row, delivered order count) — there is no stored
 * tier column that can drift out of date. Order limits are enforced again in
 * the Paystack webhook, never only in the browser.
 */

export type BuyerTier = 0 | 1 | 2;

export type TierLimits = {
  perOrderKobo: number;
  weeklyKobo: number;
};

/**
 * Launch limits. Zero per-order limit means "cannot order at all".
 * Values are launch configuration — the lead changes them in one place.
 */
export const TIER_LIMITS: Record<BuyerTier, TierLimits> = {
  0: { perOrderKobo: 0, weeklyKobo: 0 },
  1: { perOrderKobo: 50_000_00, weeklyKobo: 100_000_00 },
  2: { perOrderKobo: 500_000_00, weeklyKobo: 1_000_000_00 },
};

/** Delivered orders needed (without an identity check) to reach Tier 2. */
export const GOOD_HISTORY_DELIVERED_ORDERS = 3;

export type BuyerTierFacts = {
  emailVerified: boolean;
  phoneVerifiedAt: Date | null;
  hasVerifiedIdentity: boolean;
  deliveredOrderCount: number;
};

export function computeBuyerTier(facts: BuyerTierFacts): BuyerTier {
  if (facts.hasVerifiedIdentity) return 2;
  if (facts.deliveredOrderCount >= GOOD_HISTORY_DELIVERED_ORDERS) return 2;
  if (facts.emailVerified && facts.phoneVerifiedAt) return 1;
  return 0;
}

export type TierLimitCheck =
  | { ok: true }
  | { ok: false; reason: "order_total" | "weekly_total"; weeklyKobo: number };

/**
 * Whether an order of `orderTotalKobo` fits inside the tier's limits, given
 * how much the buyer already has in open or completed orders from the last
 * seven days (cancels, rejections and refunds are not counted).
 */
export function orderWithinTierLimits(
  tier: BuyerTier,
  orderTotalKobo: number,
  paidKoboLast7Days: number,
): TierLimitCheck {
  const limits = TIER_LIMITS[tier];
  if (orderTotalKobo > limits.perOrderKobo) {
    return { ok: false, reason: "order_total", weeklyKobo: paidKoboLast7Days };
  }
  if (paidKoboLast7Days + orderTotalKobo > limits.weeklyKobo) {
    return { ok: false, reason: "weekly_total", weeklyKobo: paidKoboLast7Days };
  }
  return { ok: true };
}

/** Per-order cap only, for the webhook defence-in-depth check. */
export function orderWithinTierPerOrderCap(
  tier: BuyerTier,
  orderTotalKobo: number,
): boolean {
  return orderTotalKobo <= TIER_LIMITS[tier].perOrderKobo;
}
