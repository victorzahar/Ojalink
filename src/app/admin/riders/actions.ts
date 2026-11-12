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
