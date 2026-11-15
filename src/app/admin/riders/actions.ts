"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/guard";
import { setUserRoleAsAdmin } from "@/lib/auth/roles";
import { getDb } from "@/lib/db";
import { roleRequests } from "@/lib/db/schema";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RoleRequestStatus = "approved" | "rejected";

type UpdateRiderRequestResult =
  | { ok: true; message: string }
  | { ok: false; message: string; status?: number };

export async function updateRiderRequestStatus(
  requestId: unknown,
  requestedStatus: unknown,
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
    }

    revalidatePath("/admin/riders");
    revalidatePath("/rider/apply");
    revalidatePath("/rider");
    revalidatePath("/buyer");

    return {
      ok: true,
      message:
        newStatus === "approved"
          ? "Rider approved — the applicant now has rider access."
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
 * CAS Guard: only operates if the rider's request status is currently 'approved'.
 * Revokes delivery privileges and reverts role back to buyer.
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
    const [updatedRequest] = await getDb()
      .update(roleRequests)
      .set({ status: "rejected", resolvedBy: auth.id })
      .where(
        and(
          eq(roleRequests.id, requestId),
          eq(roleRequests.status, "approved"),
          eq(roleRequests.requestedRole, "rider"),
        ),
      )
      .returning({ id: roleRequests.id, userId: roleRequests.userId });

    if (!updatedRequest) {
      return {
        ok: false,
        status: 409,
        message: "This rider is not currently approved or no longer exists. Refresh the page.",
      };
    }

    // Revoke rider role back to buyer
    await setUserRoleAsAdmin({
      actorId: auth.id,
      userId: targetUserId,
      role: "buyer",
    });

    revalidatePath("/admin/riders");
    revalidatePath("/rider/apply");
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
 * CAS Guard: only operates if the rider's request status is currently 'rejected'.
 * Restores delivery access and rider role.
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
    const [updatedRequest] = await getDb()
      .update(roleRequests)
      .set({ status: "approved", resolvedBy: auth.id })
      .where(
        and(
          eq(roleRequests.id, requestId),
          eq(roleRequests.status, "rejected"),
          eq(roleRequests.requestedRole, "rider"),
        ),
      )
      .returning({ id: roleRequests.id, userId: roleRequests.userId });

    if (!updatedRequest) {
      return {
        ok: false,
        status: 409,
        message: "This rider is not currently disabled or no longer exists. Refresh the page.",
      };
    }

    // Restore rider role
    await setUserRoleAsAdmin({
      actorId: auth.id,
      userId: targetUserId,
      role: "rider",
    });

    revalidatePath("/admin/riders");
    revalidatePath("/rider/apply");
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
