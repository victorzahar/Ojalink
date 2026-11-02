"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import { vendors } from "@/lib/db/schema";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type VendorApprovalStatus = "approved" | "rejected";

type UpdateVendorStatusResult =
  | { ok: true; message: string }
  | { ok: false; message: string; status?: number };

export async function updateVendorApprovalStatus(
  vendorId: unknown,
  requestedStatus: unknown,
): Promise<UpdateVendorStatusResult> {
  const auth = await requireRole({ api: true }, "admin");
  if (auth instanceof Response) {
    const body = (await auth.json()) as { error?: string };
    return {
      ok: false,
      status: auth.status,
      message: body.error ?? "You do not have access.",
    };
  }

  if (typeof vendorId !== "string" || !uuidPattern.test(vendorId)) {
    return { ok: false, message: "That vendor could not be found." };
  }

  if (requestedStatus !== "approved" && requestedStatus !== "rejected") {
    return { ok: false, message: "Choose a valid vendor status." };
  }

  const newStatus: VendorApprovalStatus = requestedStatus;

  try {
    const [updatedVendor] = await getDb()
      .update(vendors)
      .set({ approvalStatus: newStatus })
      .where(
        and(
          eq(vendors.id, vendorId),
          eq(vendors.approvalStatus, "pending"),
        ),
      )
      .returning({ id: vendors.id });

    if (!updatedVendor) {
      return {
        ok: false,
        status: 409,
        message: "This vendor is no longer waiting for review. Refresh the page and try again.",
      };
    }

    revalidatePath("/admin/vendors");
    return {
      ok: true,
      message:
        newStatus === "approved"
          ? "Vendor approved successfully."
          : "Vendor application rejected.",
    };
  } catch {
    return {
      ok: false,
      message: "Could not update this vendor. Please try again.",
    };
  }
}
