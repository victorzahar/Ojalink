// src/app/vendor/orders/actions.ts
"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import { orders, vendors } from "@/lib/db/schema";
import { vendorOrderScope } from "@/lib/orders/vendor-scope";

const CANT_CHANGE = "This order can't be changed.";
const REFUND_NOTE = "The buyer will be refunded by the admin.";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Result = { ok: true; message?: string } | { ok: false; message: string };

async function changeOrderStatus(
  orderId: string,
  nextStatus: "accepted" | "rejected",
): Promise<Result> {
  // Reject anything that isn't a plain order ID before touching the database.
  if (typeof orderId !== "string" || !UUID_PATTERN.test(orderId)) {
    return { ok: false, message: CANT_CHANGE };
  }

  const user = await requireRole("vendor", { api: true });

  // The vendor comes from the signed-in session, never from the form.
  const [vendor] = await getDb()
    .select({ id: vendors.id })
    .from(vendors)
    .where(eq(vendors.userId, user.id));
  if (!vendor) return { ok: false, message: CANT_CHANGE };

  // One conditional update: only a paid order owned by this vendor can change.
  // A double click or a stale page simply changes zero rows.
  const updated = await getDb()
    .update(orders)
    .set({ status: nextStatus, updatedAt: new Date() })
    .where(and(vendorOrderScope(vendor.id, orderId), eq(orders.status, "paid")))
    .returning({ id: orders.id });

  if (updated.length === 0) return { ok: false, message: CANT_CHANGE };

  revalidatePath("/vendor/orders");

  return nextStatus === "rejected"
    ? { ok: true, message: REFUND_NOTE }
    : { ok: true };
}

export async function acceptOrder(orderId: string): Promise<Result> {
  return changeOrderStatus(orderId, "accepted");
}

export async function rejectOrder(orderId: string): Promise<Result> {
  return changeOrderStatus(orderId, "rejected");
}
