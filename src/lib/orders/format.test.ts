import { describe, expect, it } from "vitest";

import { formatNaira } from "@/lib/orders/format";

describe("formatNaira", () => {
  it("shows whole-naira prices without decimal zeros", () => {
    expect(formatNaira(650000)).toBe("₦6,500");
  });

  it("retains decimals when the amount contains kobo", () => {
    expect(formatNaira(650001)).toBe("₦6,500.01");
  });
});
