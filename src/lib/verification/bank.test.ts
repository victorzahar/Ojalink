import { describe, expect, it } from "vitest";

import {
  accountNameMatches,
  bankAccountRefFor,
  isBankCodeFormat,
  isNigerianAccountNumber,
  normaliseAccountName,
} from "./bank";

describe("bank account name matching", () => {
  it("matches the same name in any order and with middle names", () => {
    expect(accountNameMatches("Adaeze Okafor", "ADAEZE OKAFOR")).toBe(true);
    expect(accountNameMatches("Adaeze Okafor", "OKAFOR ADAEZE")).toBe(true);
    expect(accountNameMatches("Adaeze Okafor", "Adaeze Chinelo Okafor")).toBe(true);
  });

  it("ignores business suffixes and connectors", () => {
    expect(accountNameMatches("Adaeze Okafor", "ADAEZE OKAFOR ENTERPRISES")).toBe(true);
    expect(accountNameMatches("Adaeze Okafor Fabrics Ltd", "ADAEZE OKAFOR")).toBe(true);
    expect(normaliseAccountName("Adaeze & Sons Ltd")).not.toContain("ltd");
  });

  it("rejects a different person or a typo that changes a token", () => {
    expect(accountNameMatches("Adaeze Okafor", "Adaeze Nwosu")).toBe(false);
    expect(accountNameMatches("Adaeze Okafor", "Adaeze Okaforr")).toBe(false);
    expect(accountNameMatches("Adaeze Okafor", "")).toBe(false);
  });
});

describe("bank account reference and format checks", () => {
  it("derives a stable one-way reference with no account data inside", () => {
    const ref = bankAccountRefFor("0123456789", "058");
    expect(ref).toBe(bankAccountRefFor("0123456789", "058"));
    expect(ref).not.toContain("0123456789");
    expect(bankAccountRefFor("0123456789", "011")).not.toBe(ref);
  });

  it("validates Nigerian account numbers and bank codes", () => {
    expect(isNigerianAccountNumber("0123456789")).toBe(true);
    expect(isNigerianAccountNumber("012345678")).toBe(false);
    expect(isNigerianAccountNumber("01234567ab")).toBe(false);
    expect(isBankCodeFormat("058")).toBe(true);
    expect(isBankCodeFormat("50515")).toBe(true);
    expect(isBankCodeFormat("05")).toBe(false);
  });
});
