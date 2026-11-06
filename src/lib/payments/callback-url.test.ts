import { describe, expect, it } from "vitest";

import { buildPaystackCallbackUrl } from "@/lib/payments/callback-url";

describe("Paystack callback URL", () => {
  it("builds a checkout callback from the configured HTTPS app URL", () => {
    expect(buildPaystackCallbackUrl("https://oja.example", "order-123"))
      .toBe("https://oja.example/checkout/order-123");
  });

  it.each([undefined, "", "not a URL", "ftp://oja.example", "http://oja.example", "http://localhost:3000", "https://user:pass@oja.example"])(
    "rejects an unsafe or missing app URL: %s",
    (baseUrl) => {
      expect(buildPaystackCallbackUrl(baseUrl, "order-123")).toBeNull();
    },
  );
});
