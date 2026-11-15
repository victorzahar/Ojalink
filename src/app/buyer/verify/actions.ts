"use server";

import { and, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import { identityVerifications } from "@/lib/db/schema";
import { users } from "@/lib/auth/schema";
import {
  OTP_LIFETIME_MS,
  OTP_RESEND_COOLDOWN_MS,
  generateOtpCode,
  hashOtpCode,
  isOtpCodeValidFormat,
  isOtpExpired,
  isOtpLockedOut,
} from "@/lib/verification/otp";

type PhoneActionResult =
  | { ok: true; message: string; demoCode?: string }
  | { ok: false; message: string; status?: number };

const phonePattern = /^\+?[0-9\s-]{7,15}$/;

function genericError(): PhoneActionResult {
  return { ok: false, message: "Could not send the code. Please try again." };
}

/**
 * Sends a 6-digit OTP to the given phone number. The code is stored hashed
 * (sha256) in identity_verifications.provider_ref, never in plain text.
 *
 * Demo mode: when no SMS provider key is configured, the code is returned in
 * the response instead of being sent by SMS, so the flow can be tested
 * locally. Never enabled in production with TERMII_API_KEY set.
 */
export async function requestPhoneOtp(
  input: unknown,
): Promise<PhoneActionResult> {
  const auth = await requireRole({ api: true }, "buyer");
  if (auth instanceof Response) {
    const body = (await auth.json()) as { error?: string };
    return { ok: false, status: auth.status, message: body.error ?? "You do not have access." };
  }

  const phone = typeof input === "object" && input !== null && typeof (input as { phone?: unknown }).phone === "string"
    ? (input as { phone: string }).phone.trim()
    : "";
  if (!phonePattern.test(phone)) {
    return { ok: false, message: "Enter a valid Nigerian phone number." };
  }

  const db = getDb();
  const now = new Date();

  try {
    // Resend cooldown: the newest pending code must be at least a minute old.
    const [latestPending] = await db
      .select({ createdAt: identityVerifications.createdAt })
      .from(identityVerifications)
      .where(
        and(
          eq(identityVerifications.userId, auth.id),
          eq(identityVerifications.kind, "phone_otp"),
          eq(identityVerifications.status, "pending"),
        ),
      )
      .orderBy(desc(identityVerifications.createdAt))
      .limit(1);

    if (
      latestPending &&
      now.getTime() - latestPending.createdAt.getTime() < OTP_RESEND_COOLDOWN_MS
    ) {
      return {
        ok: false,
        message: "Wait a minute before requesting another code.",
      };
    }

    const code = generateOtpCode();
    const provider = process.env.TERMII_API_KEY ? "termii" : "demo_mode";

    if (provider === "termii") {
      const response = await fetch("https://api.ng.termii.com/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: phone,
          from: process.env.TERMII_SENDER_ID ?? "OjaLink",
          sms: `Your OjaLink verification code is ${code}. It expires in 10 minutes.`,
          type: "plain",
          channel: "generic",
          api_key: process.env.TERMII_API_KEY,
        }),
      });
      if (!response.ok) {
        return { ok: false, message: "The SMS provider rejected the number. Check it and try again." };
      }
    }

    await db.insert(identityVerifications).values({
      userId: auth.id,
      kind: "phone_otp",
      status: "pending",
      provider,
      providerRef: hashOtpCode(code),
      attempts: 0,
      expiresAt: new Date(now.getTime() + OTP_LIFETIME_MS),
    });

    // Remember the number so the confirm step records the verified phone.
    await db.update(users).set({ phone }).where(eq(users.id, auth.id));

    revalidatePath("/buyer/verify");

    return provider === "termii"
      ? { ok: true, message: `Code sent to ${phone}. It expires in 10 minutes.` }
      : {
          ok: true,
          message: `Demo mode: no SMS provider configured, so here is your code.`,
          demoCode: code,
        };
  } catch {
    return genericError();
  }
}

/**
 * Confirms the OTP. On success the pending row is CAS-updated to verified and
 * users.phone_verified_at is set (Tier 1 unlocked).
 */
export async function confirmPhoneOtp(
  input: unknown,
): Promise<PhoneActionResult> {
  const auth = await requireRole({ api: true }, "buyer");
  if (auth instanceof Response) {
    const body = (await auth.json()) as { error?: string };
    return { ok: false, status: auth.status, message: body.error ?? "You do not have access." };
  }

  const code = typeof input === "object" && input !== null && typeof (input as { code?: unknown }).code === "string"
    ? (input as { code: string }).code.trim()
    : "";
  if (!isOtpCodeValidFormat(code)) {
    return { ok: false, message: "Enter the 6-digit code." };
  }

  const db = getDb();
  const now = new Date();

  try {
    const [challenge] = await db
      .select({
        id: identityVerifications.id,
        providerRef: identityVerifications.providerRef,
        attempts: identityVerifications.attempts,
        expiresAt: identityVerifications.expiresAt,
      })
      .from(identityVerifications)
      .where(
        and(
          eq(identityVerifications.userId, auth.id),
          eq(identityVerifications.kind, "phone_otp"),
          eq(identityVerifications.status, "pending"),
        ),
      )
      .orderBy(desc(identityVerifications.createdAt))
      .limit(1);

    if (!challenge) {
      return { ok: false, message: "Request a code first." };
    }
    if (isOtpLockedOut(challenge.attempts)) {
      return { ok: false, message: "Too many wrong attempts. Request a new code." };
    }
    if (!challenge.expiresAt || isOtpExpired(challenge.expiresAt, now)) {
      return { ok: false, message: "That code has expired. Request a new one." };
    }

    if (challenge.providerRef !== hashOtpCode(code)) {
      // Count the wrong attempt on the row itself (CAS: only while pending).
      const [updated] = await db
        .update(identityVerifications)
        .set({ attempts: sql`${identityVerifications.attempts} + 1` })
        .where(
          and(
            eq(identityVerifications.id, challenge.id),
            eq(identityVerifications.status, "pending"),
          ),
        )
        .returning({ attempts: identityVerifications.attempts });

      const attemptsLeft = updated ? Math.max(0, 5 - updated.attempts) : 0;
      return {
        ok: false,
        message:
          attemptsLeft > 0
            ? `Wrong code. ${attemptsLeft} attempt${attemptsLeft === 1 ? "" : "s"} left.`
            : "Too many wrong attempts. Request a new code.",
      };
    }

    // Verified: CAS the row out of pending (only a live, unexpired challenge
    // can be claimed — a concurrent tab may have already consumed it).
    const [claimed] = await db
      .update(identityVerifications)
      .set({
        status: "verified",
        checkedAt: now,
        reviewedBy: auth.id,
        reviewedAt: now,
        note: "Phone OTP challenge passed.",
      })
      .where(
        and(
          eq(identityVerifications.id, challenge.id),
          eq(identityVerifications.status, "pending"),
          gt(identityVerifications.expiresAt, now),
        ),
      )
      .returning({ id: identityVerifications.id });

    if (!claimed) {
      return { ok: false, message: "That code has expired. Request a new one." };
    }

    await db
      .update(users)
      .set({ phoneVerifiedAt: now })
      .where(and(eq(users.id, auth.id), isNull(users.phoneVerifiedAt)));

    revalidatePath("/buyer/verify");
    revalidatePath("/buyer");
    revalidatePath("/cart");

    return { ok: true, message: "Phone verified! You can now place orders." };
  } catch {
    return { ok: false, message: "Could not confirm the code. Please try again." };
  }
}
