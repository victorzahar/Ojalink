import { describe, expect, it } from "vitest";

import {
  generateOtpCode,
  hashOtpCode,
  isOtpCodeValidFormat,
  isOtpExpired,
  isOtpLockedOut,
} from "./otp";

describe("phone OTP helpers", () => {
  it("generates six-digit numeric codes", () => {
    for (let i = 0; i < 50; i += 1) {
      const code = generateOtpCode();
      expect(code).toMatch(/^[0-9]{6}$/);
      expect(isOtpCodeValidFormat(code)).toBe(true);
    }
    expect(isOtpCodeValidFormat("12345")).toBe(false);
    expect(isOtpCodeValidFormat("1234567")).toBe(false);
    expect(isOtpCodeValidFormat(123456)).toBe(false);
  });

  it("hashes codes stably and does not leak the plain code", () => {
    const digest = hashOtpCode("123456");
    expect(digest).toBe(hashOtpCode("123456"));
    expect(digest).not.toContain("123456");
    expect(digest).toMatch(/^[0-9a-f]{64}$/);
    expect(hashOtpCode("654321")).not.toBe(digest);
  });

  it("expires codes after their lifetime", () => {
    const now = new Date("2026-01-01T10:00:00Z");
    expect(isOtpExpired(new Date("2026-01-01T09:59:59Z"), now)).toBe(true);
    expect(isOtpExpired(new Date("2026-01-01T10:00:01Z"), now)).toBe(false);
  });

  it("locks out after too many wrong attempts", () => {
    expect(isOtpLockedOut(4)).toBe(false);
    expect(isOtpLockedOut(5)).toBe(true);
  });
});
