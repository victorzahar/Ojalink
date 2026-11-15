import { createHash, randomInt } from "node:crypto";

/**
 * Phone OTP challenge helpers. The code is only ever stored hashed (sha256)
 * in identity_verifications.provider_ref — never in plain text, never logged,
 * and never echoed back after the response that delivered it.
 */

export const OTP_CODE_LENGTH = 6;
export const OTP_LIFETIME_MS = 10 * 60 * 1000; // 10 minutes
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000; // 1 minute between sends

export function generateOtpCode(): string {
  return String(randomInt(0, 10 ** OTP_CODE_LENGTH)).padStart(OTP_CODE_LENGTH, "0");
}

export function hashOtpCode(code: string): string {
  return createHash("sha256").update(code, "utf8").digest("hex");
}

export function isOtpCodeValidFormat(code: unknown): code is string {
  return typeof code === "string" && new RegExp(`^[0-9]{${OTP_CODE_LENGTH}}$`).test(code);
}

export function isOtpExpired(expiresAt: Date, now: Date): boolean {
  return expiresAt.getTime() <= now.getTime();
}

export function isOtpLockedOut(attempts: number): boolean {
  return attempts >= OTP_MAX_ATTEMPTS;
}
