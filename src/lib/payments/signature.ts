import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyPaystackSignature(rawBody: string, signature: string | null, secret: string) {
  if (!signature || !secret) return false;
  const expected = createHmac("sha512", secret).update(rawBody).digest();
  let received: Buffer;
  try {
    received = Buffer.from(signature, "hex");
  } catch {
    return false;
  }
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export function isMatchingSuccessfulCharge(input: {
  event: unknown;
  status: unknown;
  currency: unknown;
  reference: unknown;
  expectedReference: string;
  amount: unknown;
  expectedAmountKobo: number;
}) {
  return input.event === "charge.success" &&
    input.status === "success" &&
    input.currency === "NGN" &&
    input.reference === input.expectedReference &&
    input.amount === input.expectedAmountKobo;
}
