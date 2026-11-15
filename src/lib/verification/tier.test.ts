import { describe, expect, it } from "vitest";

import { buyerCanOrder } from "./tier";

describe("buyer order gate", () => {
  it("blocks ordering until the phone is verified", () => {
    expect(buyerCanOrder({ phoneVerifiedAt: null })).toBe(false);
  });

  it("allows verified buyers to order any amount", () => {
    expect(buyerCanOrder({ phoneVerifiedAt: new Date() })).toBe(true);
  });
});
