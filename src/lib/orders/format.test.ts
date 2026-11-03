import { describe, expect, it } from "vitest";

import { formatNaira } from "@/lib/orders/format";

describe("formatNaira", () => {
  it("shows two decimal places for whole-naira amounts", () => {
    expect(formatNaira(650000)).toBe("₦6,500.00");
  });

  it("retains decimals when the amount contains kobo", () => {
    expect(formatNaira(650001)).toBe("₦6,500.01");
  });
});
