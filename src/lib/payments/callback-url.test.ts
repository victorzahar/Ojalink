import { describe, expect, it } from "vitest";

import { buildPaystackCallbackUrl } from "@/lib/payments/callback-url";

describe("Paystack callback URL", () => {
  it("builds a checkout callback from the configured HTTPS app URL", () => {
    expect(buildPaystackCallbackUrl("https://oja.example", "order-123"))
      .toBe("https://oja.example/checkout/order-123");
  });

  it("allows plain http for localhost so Paystack test checkout works in dev", () => {
    expect(buildPaystackCallbackUrl("http://localhost:3001", "order-123"))
      .toBe("http://localhost:3001/checkout/order-123");
    expect(buildPaystackCallbackUrl("http://127.0.0.1:3000", "order-123"))
      .toBe("http://127.0.0.1:3000/checkout/order-123");
  });

  it.each([undefined, "", "not a URL", "ftp://oja.example", "http://oja.example", "https://user:pass@oja.example", "http://localhost.evil.example"])(
    "rejects an unsafe or missing app URL: %s",
    (baseUrl) => {
      expect(buildPaystackCallbackUrl(baseUrl, "order-123")).toBeNull();
    },
  );
});
