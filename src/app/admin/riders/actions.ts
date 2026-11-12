"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/guard";
import { setUserRoleAsAdmin } from "@/lib/auth/roles";
import { getDb } from "@/lib/db";
import { roleRequests } from "@/lib/db/schema";
import { recordVerificationAuditLog } from "@/lib/verification/security-guard";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RoleRequestStatus = "approved" | "rejected";

type UpdateRiderRequestResult =
  | { ok: true; message: string }
  | { ok: false; message: string; status?: number };

/**
 * Log admin inspection of a rider's guarantor letter / signature document (NDPA 2023 compliance).
 */
export async function logAdminGuarantorInspection(
  requestId: string,
  targetUserId: string,
): Promise<{ ok: boolean }> {
  const auth = await requireRole({ api: true }, "admin");
  if (auth instanceof Response) {
    return { ok: false };
  }

  recordVerificationAuditLog(
    auth.id,
    targetUserId,
    "view_guarantor_letter",
    `Admin inspected guarantor letter and signature for rider request ${requestId}`,
  );

  return { ok: true };
}

export async function updateRiderRequestStatus(
  requestId: unknown,
  requestedStatus: unknown,
  guarantorVerified: boolean = true,
): Promise<UpdateRiderRequestResult> {
  const auth = await requireRole({ api: true }, "admin");
  if (auth instanceof Response) {
    const body = (await auth.json()) as { error?: string };
    return {
      ok: false,
      status: auth.status,
      message: body.error ?? "You do not have access.",
    };
  }

  if (typeof requestId !== "string" || !uuidPattern.test(requestId)) {
    return { ok: false, message: "That request could not be found." };
  }

  if (requestedStatus !== "approved" && requestedStatus !== "rejected") {
    return { ok: false, message: "Choose a valid status." };
  }

  const newStatus: RoleRequestStatus = requestedStatus;

  if (newStatus === "approved" && !guarantorVerified) {
    return {
      ok: false,
      message: "A verified guarantor letter or signature is required before approving a rider.",
    };
  }

  try {
    const [updatedRequest] = await getDb()
      .update(roleRequests)
      .set({ status: newStatus, resolvedBy: auth.id })
      .where(
        and(
          eq(roleRequests.id, requestId),
          eq(roleRequests.status, "pending"),
          eq(roleRequests.requestedRole, "rider"),
        ),
      )
      .returning({ id: roleRequests.id, userId: roleRequests.userId });

    if (!updatedRequest) {
      return {
        ok: false,
        status: 409,
        message: "This request is no longer waiting for review. Refresh the page and try again.",
      };
    }

    // Approving also grants the applicant rider access. Rejected
    // applications leave the applicant as a buyer.
    if (newStatus === "approved") {
      await setUserRoleAsAdmin({
        actorId: auth.id,
        userId: updatedRequest.userId,
        role: "rider",
      });

      recordVerificationAuditLog(
        auth.id,
        updatedRequest.userId,
        "approve_rider",
        "Rider approved following verified guarantor letter and signature review",
      );
    }

    revalidatePath("/admin/riders");
    revalidatePath("/rider/apply");
    revalidatePath("/rider");
    revalidatePath("/buyer");

    return {
      ok: true,
      message:
        newStatus === "approved"
          ? "Rider approved — guarantor verified and rider role granted."
          : "Rider application rejected.",
    };
  } catch {
    return {
      ok: false,
      message: "Could not update this request. Please try again.",
    };
  }
}

/**
 * Disable an active rider (e.g. rider left platform, inactive, or suspended).
 * Revokes the rider role back to buyer and logs an NDPA audit event.
 */
export async function disableRider(
  requestId: unknown,
  targetUserId: unknown,
): Promise<UpdateRiderRequestResult> {
  const auth = await requireRole({ api: true }, "admin");
  if (auth instanceof Response) {
    const body = (await auth.json()) as { error?: string };
    return {
      ok: false,
      status: auth.status,
      message: body.error ?? "You do not have access.",
    };
  }

  if (typeof requestId !== "string" || !uuidPattern.test(requestId)) {
    return { ok: false, message: "That request could not be found." };
  }

  if (typeof targetUserId !== "string" || !uuidPattern.test(targetUserId)) {
    return { ok: false, message: "Invalid user ID." };
  }

  try {
    const db = getDb();

    // 1. Update role_requests status to rejected
    const [updated] = await db
      .update(roleRequests)
      .set({ status: "rejected", resolvedBy: auth.id })
      .where(and(eq(roleRequests.id, requestId), eq(roleRequests.requestedRole, "rider")))
      .returning({ id: roleRequests.id });

    if (!updated) {
      return { ok: false, message: "Could not find that rider request." };
    }

    // 2. Revoke rider role back to buyer
    await setUserRoleAsAdmin({
      actorId: auth.id,
      userId: targetUserId,
      role: "buyer",
    });

    // 3. Record NDPA compliance audit event
    recordVerificationAuditLog(
      auth.id,
      targetUserId,
      "disable_rider",
      `Admin disabled rider request ${requestId} and revoked delivery privileges`,
    );

    revalidatePath("/admin/riders");
    revalidatePath("/rider");
    revalidatePath("/buyer");

    return {
      ok: true,
      message: "Rider disabled. Delivery privileges have been revoked and role reset to buyer.",
    };
  } catch {
    return {
      ok: false,
      message: "Could not disable this rider. Please try again.",
    };
  }
}

/**
 * Re-activate a disabled or rejected rider who has returned to the platform.
 */
export async function reactivateRider(
  requestId: unknown,
  targetUserId: unknown,
): Promise<UpdateRiderRequestResult> {
  const auth = await requireRole({ api: true }, "admin");
  if (auth instanceof Response) {
    const body = (await auth.json()) as { error?: string };
    return {
      ok: false,
      status: auth.status,
      message: body.error ?? "You do not have access.",
    };
  }

  if (typeof requestId !== "string" || !uuidPattern.test(requestId)) {
    return { ok: false, message: "That request could not be found." };
  }

  if (typeof targetUserId !== "string" || !uuidPattern.test(targetUserId)) {
    return { ok: false, message: "Invalid user ID." };
  }

  try {
    const db = getDb();

    // 1. Update role_requests status to approved
    const [updated] = await db
      .update(roleRequests)
      .set({ status: "approved", resolvedBy: auth.id })
      .where(and(eq(roleRequests.id, requestId), eq(roleRequests.requestedRole, "rider")))
      .returning({ id: roleRequests.id });

    if (!updated) {
      return { ok: false, message: "Could not find that rider request." };
    }

    // 2. Restore rider role
    await setUserRoleAsAdmin({
      actorId: auth.id,
      userId: targetUserId,
      role: "rider",
    });

    // 3. Record audit event
    recordVerificationAuditLog(
      auth.id,
      targetUserId,
      "reactivate_rider",
      `Admin re-activated rider request ${requestId} and restored delivery access`,
    );

    revalidatePath("/admin/riders");
    revalidatePath("/rider");
    revalidatePath("/buyer");

    return {
      ok: true,
      message: "Rider re-activated. Delivery privileges and rider access have been restored.",
    };
  } catch {
    return {
      ok: false,
      message: "Could not re-activate this rider. Please try again.",
    };
  }
}
