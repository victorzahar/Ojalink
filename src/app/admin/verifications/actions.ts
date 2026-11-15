"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import { guarantors, identityVerifications, verificationAuditLogs } from "@/lib/db/schema";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const NOTE_MAX = 1000;

type ReviewResult =
  | { ok: true; message: string }
  | { ok: false; message: string; status?: number };

/**
 * Approve or reject a pending identity verification row (CAS: only while
 * pending). A note is always recorded; a rejection is not possible without
 * one. Every decision lands in verification_audit_logs.
 */
export async function reviewVerification(
  verificationId: unknown,
  requestedStatus: unknown,
  requestedNote: unknown,
): Promise<ReviewResult> {
  const auth = await requireRole({ api: true }, "admin");
  if (auth instanceof Response) {
    const body = (await auth.json()) as { error?: string };
    return { ok: false, status: auth.status, message: body.error ?? "You do not have access." };
  }

  if (typeof verificationId !== "string" || !uuidPattern.test(verificationId)) {
    return { ok: false, message: "That verification could not be found." };
  }
  if (requestedStatus !== "verified" && requestedStatus !== "failed") {
    return { ok: false, message: "Choose Verified or Failed." };
  }
  if (typeof requestedNote !== "string") {
    return { ok: false, message: "Add a review note." };
  }

  const status: "verified" | "failed" = requestedStatus;
  const note = requestedNote.trim();
  if (note.length === 0) {
    return {
      ok: false,
      message: status === "failed"
        ? "Write what you checked before rejecting a verification."
        : "Write what you checked before approving a verification.",
    };
  }
  if (note.length > NOTE_MAX) {
    return { ok: false, message: `Keep the note under ${NOTE_MAX} characters.` };
  }

  try {
    const now = new Date();
    const [updated] = await getDb()
      .update(identityVerifications)
      .set({
        status,
        note,
        reviewedBy: auth.id,
        reviewedAt: now,
      })
      .where(
        and(
          eq(identityVerifications.id, verificationId),
          eq(identityVerifications.status, "pending"),
        ),
      )
      .returning({ id: identityVerifications.id, userId: identityVerifications.userId });

    if (!updated) {
      return {
        ok: false,
        status: 409,
        message: "This verification is no longer pending. Refresh the page and try again.",
      };
    }

    await getDb().insert(verificationAuditLogs).values({
      adminId: auth.id,
      verificationId: updated.id,
      action: status === "verified" ? "approve" : "reject",
      note,
    });

    revalidatePath("/admin/verifications");
    revalidatePath("/buyer");
    revalidatePath("/vendor/payouts");

    return {
      ok: true,
      message: status === "verified" ? "Verification approved." : "Verification rejected.",
    };
  } catch {
    return { ok: false, message: "Could not save this review. Please try again." };
  }
}

/**
 * Records the outcome of a guarantor phone call (CAS: only while pending).
 * The call outcome is logged for the audit trail.
 */
export async function recordGuarantorCall(
  guarantorId: unknown,
  requestedOutcome: unknown,
  requestedNote: unknown,
): Promise<ReviewResult> {
  const auth = await requireRole({ api: true }, "admin");
  if (auth instanceof Response) {
    const body = (await auth.json()) as { error?: string };
    return { ok: false, status: auth.status, message: body.error ?? "You do not have access." };
  }

  if (typeof guarantorId !== "string" || !uuidPattern.test(guarantorId)) {
    return { ok: false, message: "That guarantor could not be found." };
  }
  if (requestedOutcome !== "reachable" && requestedOutcome !== "unreachable") {
    return { ok: false, message: "Choose Reachable or Unreachable." };
  }
  if (typeof requestedNote !== "string") {
    return { ok: false, message: "Add a note about the call." };
  }

  const outcome: "reachable" | "unreachable" = requestedOutcome;
  const callNote = requestedNote.trim();
  if (callNote.length === 0) {
    return { ok: false, message: "Write what the guarantor said before saving the call." };
  }
  if (callNote.length > NOTE_MAX) {
    return { ok: false, message: `Keep the note under ${NOTE_MAX} characters.` };
  }

  try {
    const now = new Date();
    const [updated] = await getDb()
      .update(guarantors)
      .set({
        outcome,
        calledBy: auth.id,
        calledAt: now,
        callNote,
      })
      .where(
        and(
          eq(guarantors.id, guarantorId),
          eq(guarantors.outcome, "pending"),
        ),
      )
      .returning({ id: guarantors.id, userId: guarantors.userId });

    if (!updated) {
      return {
        ok: false,
        status: 409,
        message: "This guarantor call was already recorded. Refresh the page.",
      };
    }

    await getDb().insert(verificationAuditLogs).values({
      adminId: auth.id,
      guarantorId: updated.id,
      action: "guarantor_call",
      note: `${outcome}: ${callNote}`,
    });

    revalidatePath("/admin/verifications");
    revalidatePath("/admin/riders");

    return { ok: true, message: "Guarantor call recorded." };
  } catch {
    return { ok: false, message: "Could not save this call. Please try again." };
  }
}
