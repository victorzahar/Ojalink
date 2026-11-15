"use server";

import { and, eq } from "drizzle-orm";
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

/** Lagos date (YYYY-MM-DD) `days` days from now — the payout hold horizon. */
function lagosDatePlusDays(days: number): string {
  const later = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(later);
}

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
      .set({
        approvalStatus: newStatus,
        // First payouts are held 3 days from approval so the vendor's first
        // delivered orders can settle (and refunds, if any, surface first).
        payoutHoldUntil: newStatus === "approved" ? lagosDatePlusDays(3) : null,
      })
      .where(
        and(
          eq(vendors.id, vendorId),
          eq(vendors.approvalStatus, "pending"),
        ),
      )
      .returning({ id: vendors.id, userId: vendors.userId });

    if (!updatedVendor) {
      return {
        ok: false,
        status: 409,
        message: "This vendor is no longer waiting for review. Refresh the page and try again.",
      };
    }

    // Approving a shop also grants its owner vendor access. Rejected
    // applications leave the applicant as a buyer.
    if (newStatus === "approved") {
      await setUserRoleAsAdmin({
        actorId: auth.id,
        userId: updatedVendor.userId,
        role: "vendor",
      });
    }

    revalidatePath("/admin/vendors");
    revalidatePath("/vendor/apply");
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
