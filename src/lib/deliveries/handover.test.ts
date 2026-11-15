import { describe, expect, it } from "vitest";

import { generateHandoverCode, isValidHandoverCode } from "./handover";

describe("delivery handover codes", () => {
  it("generates four-digit numeric codes", () => {
    for (let i = 0; i < 50; i += 1) {
      const code = generateHandoverCode();
      expect(code).toMatch(/^[0-9]{4}$/);
      expect(isValidHandoverCode(code)).toBe(true);
    }
  });

  it("rejects malformed codes", () => {
    expect(isValidHandoverCode("123")).toBe(false);
    expect(isValidHandoverCode("12345")).toBe(false);
    expect(isValidHandoverCode("12a4")).toBe(false);
    expect(isValidHandoverCode(null)).toBe(false);
    expect(isValidHandoverCode(undefined)).toBe(false);
  });
});
