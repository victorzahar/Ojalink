"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import { disputes } from "@/lib/db/schema";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type EditableDisputeStatus = "open" | "resolved";

export type SaveDisputeResolutionResult =
  | { ok: true; message: string }
  | { ok: false; message: string; status?: number };

export async function saveDisputeResolution(
  disputeId: unknown,
  requestedStatus: unknown,
  requestedNote: unknown,
): Promise<SaveDisputeResolutionResult> {
  const auth = await requireRole({ api: true }, "admin");
  if (auth instanceof Response) {
    const body = (await auth.json()) as { error?: string };
    return {
      ok: false,
      status: auth.status,
      message: body.error ?? "You do not have access.",
    };
  }

  if (typeof disputeId !== "string" || !uuidPattern.test(disputeId)) {
    return { ok: false, message: "That dispute could not be found." };
  }

  if (requestedStatus !== "open" && requestedStatus !== "resolved") {
    return {
      ok: false,
      message: "Choose Open or Resolved. Refunded status is set by the refund workflow.",
    };
  }

  if (typeof requestedNote !== "string") {
    return { ok: false, message: "Enter a resolution note." };
  }

  const status: EditableDisputeStatus = requestedStatus;
  const resolutionNote = requestedNote.trim();

  if (resolutionNote.length > 2000) {
    return { ok: false, message: "Keep the resolution note under 2,000 characters." };
  }

  if (status === "resolved" && resolutionNote.length === 0) {
    return { ok: false, message: "Add a resolution note before resolving this dispute." };
  }

  try {
    const [updatedDispute] = await getDb()
      .update(disputes)
      .set({ status, resolutionNote: resolutionNote || null })
      .where(
        and(
          eq(disputes.id, disputeId),
          ne(disputes.status, "refunded"),
        ),
      )
      .returning({ id: disputes.id });

    if (!updatedDispute) {
      return {
        ok: false,
        status: 409,
        message: "This dispute could not be updated. It may be missing or already refunded.",
      };
    }

    revalidatePath("/admin/disputes");
    revalidatePath(`/admin/disputes/${disputeId}`);
    return { ok: true, message: "Dispute resolution saved." };
  } catch {
    return {
      ok: false,
      message: "Could not save this dispute. Please try again.",
    };
  }
}
