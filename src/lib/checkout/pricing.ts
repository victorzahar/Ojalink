export const DELIVERY_FEE_KOBO = 30_000;
export const PLATFORM_FEE_KOBO = 10_000;

export type CheckoutLinePrice = { priceKobo: number; quantity: number };

export function calculateCheckoutTotals(lines: CheckoutLinePrice[]) {
  const subtotalKobo = lines.reduce((total, line) => {
    if (!Number.isSafeInteger(line.priceKobo) || line.priceKobo < 0 || !Number.isSafeInteger(line.quantity) || line.quantity < 1) {
      throw new Error("Invalid checkout line.");
    }
    const lineTotal = line.priceKobo * line.quantity;
    if (!Number.isSafeInteger(lineTotal) || !Number.isSafeInteger(total + lineTotal)) {
      throw new Error("Checkout amount is too large.");
    }
    return total + lineTotal;
  }, 0);
  const totalKobo = subtotalKobo + DELIVERY_FEE_KOBO + PLATFORM_FEE_KOBO;
  if (!Number.isSafeInteger(totalKobo)) throw new Error("Checkout amount is too large.");
  return { subtotalKobo, deliveryFeeKobo: DELIVERY_FEE_KOBO, platformFeeKobo: PLATFORM_FEE_KOBO, totalKobo };
}
