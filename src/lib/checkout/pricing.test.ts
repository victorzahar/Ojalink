import { describe, expect, it } from "vitest";
import { calculateCheckoutTotals } from "@/lib/checkout/pricing";
import { validateCheckoutAddress } from "@/lib/checkout/validation";

describe("checkout totals", () => {
  it("calculates integer kobo totals from database line prices", () => {
    expect(calculateCheckoutTotals([
      { priceKobo: 42_500, quantity: 2 },
      { priceKobo: 10_050, quantity: 1 },
    ])).toEqual({ subtotalKobo: 95_050, deliveryFeeKobo: 30_000, platformFeeKobo: 10_000, totalKobo: 135_050 });
  });
  it("rejects unsafe or negative amounts", () => {
    expect(() => calculateCheckoutTotals([{ priceKobo: Number.MAX_SAFE_INTEGER, quantity: 2 }])).toThrow();
    expect(() => calculateCheckoutTotals([{ priceKobo: -1, quantity: 1 }])).toThrow();
  });
});
describe("checkout address validation", () => {
  it("ignores totals posted by the browser", () => {
    expect(validateCheckoutAddress({ deliveryAddress: "12 Uselu Market Road", deliveryArea: "Uselu", totalKobo: 1 }))
      .toEqual({ success: true, data: { deliveryAddress: "12 Uselu Market Road", deliveryArea: "Uselu" } });
  });
  it("rejects invalid delivery details", () => {
    expect(validateCheckoutAddress({ deliveryAddress: "Home", deliveryArea: "Anywhere" }).success).toBe(false);
  });
});
