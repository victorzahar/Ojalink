import { describe, expect, it } from "vitest";

import {
  CHECKOUT_STOCK_HOLD_MS,
  canConsumeStockReservations,
  getAvailableStock,
  hasValidStockReservations,
} from "@/lib/checkout/stock";

const now = new Date("2026-11-04T12:00:00.000Z");
const productA = "product-a";
const productB = "product-b";

describe("checkout stock holds", () => {
  it("uses a 15-minute stock hold", () => {
    expect(CHECKOUT_STOCK_HOLD_MS).toBe(15 * 60 * 1000);
  });

  it("subtracts active holds from physical stock without returning a negative quantity", () => {
    expect(getAvailableStock(8, 3)).toBe(5);
    expect(getAvailableStock(2, 4)).toBe(0);
  });

  it("consumes only complete, active reservation sets for an order", () => {
    expect(hasValidStockReservations([
      { productId: productA, quantity: 2, status: "reserved", expiresAt: new Date(now.getTime() + 1) },
      { productId: productB, quantity: 1, status: "reserved", expiresAt: new Date(now.getTime() + 1) },
    ], [productA, productB], now)).toBe(true);
  });

  it("requires the reserved quantities and eligible inventory to still match", () => {
    const reservations = [
      { productId: productA, quantity: 2, status: "reserved" as const, expiresAt: new Date(now.getTime() + 1) },
    ];
    const expected = new Map([[productA, 2]]);
    expect(canConsumeStockReservations(reservations, expected, new Map([
      [productA, { stockQuantity: 2, isAvailable: true, isVendorApproved: true }],
    ]), now)).toBe(true);
    expect(canConsumeStockReservations(reservations, new Map([[productA, 3]]), new Map([
      [productA, { stockQuantity: 2, isAvailable: true, isVendorApproved: true }],
    ]), now)).toBe(false);
    expect(canConsumeStockReservations(reservations, expected, new Map([
      [productA, { stockQuantity: 2, isAvailable: false, isVendorApproved: true }],
    ]), now)).toBe(false);
    expect(canConsumeStockReservations(reservations, expected, new Map([
      [productA, { stockQuantity: 1, isAvailable: true, isVendorApproved: true }],
    ]), now)).toBe(false);
  });

  it.each([
    ["expired", [{ productId: productA, quantity: 1, status: "reserved" as const, expiresAt: now }]],
    ["released", [{ productId: productA, quantity: 1, status: "released" as const, expiresAt: new Date(now.getTime() + 1) }]],
    ["missing product", [{ productId: null, quantity: 1, status: "reserved" as const, expiresAt: new Date(now.getTime() + 1) }]],
    ["incomplete", []],
  ])("rejects a %s reservation set", (_label, reservations) => {
    expect(hasValidStockReservations(reservations, [productA], now)).toBe(false);
  });
});
