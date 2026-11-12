"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/guard";
import { setUserRoleAsAdmin } from "@/lib/auth/roles";
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
      .where(eq(vendors.id, vendorId))
      .returning({ id: vendors.id, userId: vendors.userId });

    if (!updatedVendor) {
      return {
        ok: false,
        status: 404,
        message: "This vendor could not be found. Refresh the page and try again.",
      };
    }

    // Approving a shop grants its owner vendor access. Rejected
    // applications leave or return the applicant to a buyer.
    if (newStatus === "approved") {
      await setUserRoleAsAdmin({
        actorId: auth.id,
        userId: updatedVendor.userId,
        role: "vendor",
      });
    } else if (newStatus === "rejected") {
      await setUserRoleAsAdmin({
        actorId: auth.id,
        userId: updatedVendor.userId,
        role: "buyer",
      });
    }

    revalidatePath("/admin/vendors");
    revalidatePath("/vendor/apply");
    revalidatePath("/buyer");
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
