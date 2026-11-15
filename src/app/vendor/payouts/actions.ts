"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import { identityVerifications } from "@/lib/db/schema";
import {
  accountNameMatches,
  bankAccountRefFor,
  isBankCodeFormat,
  isNigerianAccountNumber,
} from "@/lib/verification/bank";

type VerifyPayoutResult =
  | { ok: true; message: string }
  | { ok: false; message: string; status?: number };

/**
 * Verifies a vendor's bank account through Paystack's account resolver.
 *
 * NDPA rule: the account number is sent to Paystack and never stored — only a
 * one-way reference and the name-match verdict land in the database, recorded
 * as an identity_verifications row (kind bank_account).
 */
export async function verifyPayoutAccount(
  input: unknown,
): Promise<VerifyPayoutResult> {
  const auth = await requireRole({ api: true }, "vendor");
  if (auth instanceof Response) {
    const body = (await auth.json()) as { error?: string };
    return { ok: false, status: auth.status, message: body.error ?? "You do not have access." };
  }

  const raw = (typeof input === "object" && input !== null ? input : {}) as {
    bankCode?: unknown;
    accountNumber?: unknown;
  };
  const bankCode = typeof raw.bankCode === "string" ? raw.bankCode.trim() : "";
  const accountNumber = typeof raw.accountNumber === "string" ? raw.accountNumber.trim() : "";

  if (!isBankCodeFormat(bankCode)) {
    return { ok: false, message: "Choose the bank from the list." };
  }
  if (!isNigerianAccountNumber(accountNumber)) {
    return { ok: false, message: "A Nigerian bank account number is 10 digits." };
  }

  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret || !secret.startsWith("sk_test_")) {
    return {
      ok: false,
      message: "Bank verification is not configured yet. Ask the admin to enable it.",
    };
  }

  const db = getDb();
  const now = new Date();

  try {
    // Already verified? Nothing to do.
    const [existing] = await db
      .select({ id: identityVerifications.id })
      .from(identityVerifications)
      .where(
        and(
          eq(identityVerifications.userId, auth.id),
          eq(identityVerifications.kind, "bank_account"),
          eq(identityVerifications.status, "verified"),
        ),
      )
      .limit(1);
    if (existing) {
      return { ok: false, message: "Your payout account is already verified." };
    }

    const response = await fetch(
      `https://api.paystack.co/bank/resolve?account_number=${encodeURIComponent(accountNumber)}&bank_code=${encodeURIComponent(bankCode)}`,
      { headers: { Authorization: `Bearer ${secret}` } },
    );
    const payload = (await response.json().catch(() => null)) as
      | {
          status?: boolean;
          message?: string;
          data?: { account_name?: string; account_number?: string; bank_name?: string };
        }
      | null;

    const resolvedName = payload?.data?.account_name;
    if (!response.ok || !payload?.status || !resolvedName) {
      const reason = payload?.message ?? "the account could not be resolved";
      await db.insert(identityVerifications).values({
        userId: auth.id,
        kind: "bank_account",
        status: "failed",
        provider: "paystack",
        providerRef: bankAccountRefFor(accountNumber, bankCode),
        note: `Paystack resolve failed: ${reason}.`,
        reviewedBy: auth.id,
        reviewedAt: now,
        checkedAt: now,
      });
      revalidatePath("/vendor/payouts");
      return {
        ok: false,
        message: "That account could not be verified. Check the number and bank, then try again.",
      };
    }

    const matched = accountNameMatches(auth.name, resolvedName);
    await db.insert(identityVerifications).values({
      userId: auth.id,
      kind: "bank_account",
      status: matched ? "verified" : "failed",
      provider: "paystack",
      providerRef: bankAccountRefFor(accountNumber, bankCode),
      note: matched
        ? "Paystack resolved the account; the holder name matches the profile."
        : `Paystack resolved the account to "${resolvedName}", which does not match the profile name.`,
      reviewedBy: auth.id,
      reviewedAt: now,
      checkedAt: now,
    });

    revalidatePath("/vendor/payouts");

    return matched
      ? { ok: true, message: "Payout account verified. You are set to receive weekly payouts." }
      : {
          ok: false,
          message: `The account belongs to "${resolvedName}", not to ${auth.name}. Use an account in your own name.`,
        };
  } catch {
    return { ok: false, message: "Could not verify this account right now. Please try again." };
  }
}
