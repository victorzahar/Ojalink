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
