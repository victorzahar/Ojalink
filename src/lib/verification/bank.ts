import { createHash } from "node:crypto";

/**
 * Bank account verification (Paystack account resolution). The account number
 * is sent to Paystack and never stored — we keep only a one-way reference and
 * the name-match verdict, so the database holds no bank details.
 */

/**
 * Names that carry no identity meaning when matching an account holder name
 * against a verified profile name (business suffixes, connectors).
 */
const NAME_NOISE = new Set([
  "ltd", "limited", "plc", "ng", "nig", "nigeria", "nigerian",
  "enterprises", "enterprise", "ventures", "venture", "global",
  "services", "concept", "concepts", "and", "&", "the", "of",
  "mfb", "microfinance", "bank", "co", "company",
]);

export function normaliseAccountName(name: string): string[] {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 0 && !NAME_NOISE.has(token));
}

/**
 * Match the account name Paystack resolved against the name on the verified
 * profile. Tolerates middle names, ordering ("Okafor Adaeze") and business
 * suffixes. Two acceptable shapes: every meaningful profile token appears in
 * the resolved name, or every resolved token appears in the profile name
 * (e.g. "ADAEZE OKAFOR" for profile "Adaeze Okafor Fabrics Ltd").
 */
export function accountNameMatches(profileName: string, resolvedName: string): boolean {
  const profileTokens = normaliseAccountName(profileName);
  const resolvedTokens = normaliseAccountName(resolvedName);

  if (profileTokens.length === 0 || resolvedTokens.length === 0) return false;

  const resolvedSet = new Set(resolvedTokens);
  const profileSet = new Set(profileTokens);
  const matched = profileTokens.filter((token) => resolvedSet.has(token)).length;

  // Every profile token must appear, or — when the profile name is long — at
  // least 80% of it, so a first + two surnames still matches a first + one.
  const required = profileTokens.length <= 3
    ? profileTokens.length
    : Math.ceil(profileTokens.length * 0.8);

  const profileCovered = matched >= required;
  const resolvedCovered = resolvedTokens.every((token) => profileSet.has(token));

  return profileCovered || resolvedCovered;
}

/** One-way reference for a bank account: no reversible account data stored. */
export function bankAccountRefFor(accountNumber: string, bankCode: string): string {
  return "paystack_" + createHash("sha256")
    .update(`${bankCode}:${accountNumber}`, "utf8")
    .digest("hex")
    .slice(0, 24);
}

export function isNigerianAccountNumber(value: unknown): value is string {
  return typeof value === "string" && /^[0-9]{10}$/.test(value);
}

export function isBankCodeFormat(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-z]{3,10}$/i.test(value);
}
