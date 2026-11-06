export const CHECKOUT_STOCK_HOLD_MS = 15 * 60 * 1000;

export type StockReservationSnapshot = {
  productId: string | null;
  quantity: number;
  status: "reserved" | "consumed" | "released";
  expiresAt: Date;
};

export function getAvailableStock(stockQuantity: number, reservedQuantity: number) {
  return Math.max(0, stockQuantity - reservedQuantity);
}

export function hasValidStockReservations(
  reservations: StockReservationSnapshot[],
  expectedProductIds: string[],
  now: Date,
) {
  if (reservations.length !== expectedProductIds.length) return false;

  const byProduct = new Map<string, StockReservationSnapshot>();
  for (const reservation of reservations) {
    if (
      reservation.status !== "reserved" ||
      reservation.productId === null ||
      reservation.expiresAt <= now ||
      !Number.isSafeInteger(reservation.quantity) ||
      reservation.quantity < 1 ||
      byProduct.has(reservation.productId)
    ) {
      return false;
    }
    byProduct.set(reservation.productId, reservation);
  }

  return expectedProductIds.every((productId) => byProduct.has(productId));
}

export function canConsumeStockReservations(
  reservations: StockReservationSnapshot[],
  expectedQuantities: ReadonlyMap<string, number>,
  products: ReadonlyMap<string, { stockQuantity: number; isAvailable: boolean; isVendorApproved: boolean }>,
  now: Date,
) {
  const expectedProductIds = [...expectedQuantities.keys()];
  if (!hasValidStockReservations(reservations, expectedProductIds, now)) return false;

  return expectedProductIds.every((productId) => {
    const reservation = reservations.find((item) => item.productId === productId);
    const product = products.get(productId);
    return reservation !== undefined &&
      reservation.quantity === expectedQuantities.get(productId) &&
      product !== undefined &&
      product.isAvailable &&
      product.isVendorApproved &&
      product.stockQuantity >= reservation.quantity;
  });
}
