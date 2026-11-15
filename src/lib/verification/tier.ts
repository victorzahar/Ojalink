/**
 * Buyer verification gate (Nigeria).
 *
 * There are no spending caps — by lead decision the amount limits were
 * removed. Ordering is gated purely on phone verification: unverified
 * accounts can browse, verified accounts can order any amount. The check is
 * enforced again in the Paystack webhook, never only in the browser.
 */

/** Whether a buyer may place orders: a verified phone number is required. */
export type BuyerOrderGate = {
  phoneVerifiedAt: Date | null;
};

export function buyerCanOrder(facts: BuyerOrderGate): boolean {
  return facts.phoneVerifiedAt !== null;
}

