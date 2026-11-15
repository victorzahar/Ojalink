import { randomInt } from "node:crypto";

/**
 * Delivery handover code: shown to the buyer, required from the rider to
 * close a delivery ("Rider app shows photo and plate... delivery confirmation
 * code from the buyer when handing over goods").
 */

export function generateHandoverCode(): string {
  return String(randomInt(0, 10000)).padStart(4, "0");
}

export function isValidHandoverCode(code: unknown): code is string {
  return typeof code === "string" && /^[0-9]{4}$/.test(code);
}
