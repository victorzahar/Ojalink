import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";

import { isMatchingSuccessfulCharge, verifyPaystackSignature } from "@/lib/payments/signature";

describe("Paystack webhook verification", () => {
  const secret = "sk_test_unit_test_only";
  const body = '{"event":"charge.success","data":{"reference":"ref-1","amount":135050}}';

  it("accepts the HMAC SHA512 signature for the raw body", () => {
    const signature = createHmac("sha512", secret).update(body).digest("hex");
    expect(verifyPaystackSignature(body, signature, secret)).toBe(true);
    expect(verifyPaystackSignature(body + " ", signature, secret)).toBe(false);
  });

  it("rejects missing signatures", () => {
    expect(verifyPaystackSignature(body, null, secret)).toBe(false);
  });

  it("requires matching successful NGN reference and database amount", () => {
    const base = {
      event: "charge.success",
      status: "success",
      currency: "NGN",
      reference: "ref-1",
      expectedReference: "ref-1",
      amount: 135050,
      expectedAmountKobo: 135050,
    };
    expect(isMatchingSuccessfulCharge(base)).toBe(true);
    expect(isMatchingSuccessfulCharge({ ...base, amount: 1 })).toBe(false);
    expect(isMatchingSuccessfulCharge({ ...base, reference: "other" })).toBe(false);
    expect(isMatchingSuccessfulCharge({ ...base, event: "charge.failed" })).toBe(false);
  });
});
