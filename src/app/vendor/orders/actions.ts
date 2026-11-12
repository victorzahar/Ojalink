"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import { orders, users, vendors } from "@/lib/db/schema";
import { sendOrderStatusEmail } from "@/lib/orders/status-email";
import { vendorOrderScope } from "@/lib/orders/vendor-scope";

const CANT_CHANGE = "This order can't be changed.";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Result = { ok: true; message?: string } | { ok: false; message: string };

async function changeOrderStatus(
  orderId: unknown,
  nextStatus: "accepted" | "rejected",
): Promise<Result> {
  // Check who is asking first. The mode ({ api: true }) always comes first.
  const auth = await requireRole({ api: true }, "vendor");
  if (auth instanceof Response) {
    return { ok: false, message: "You do not have access." };
  }

  // Reject anything that isn't a plain order ID before touching the database.
  if (typeof orderId !== "string" || !UUID_PATTERN.test(orderId)) {
    return { ok: false, message: CANT_CHANGE };
  }

  // The vendor comes from the signed-in session, never from the form.
  const [vendor] = await getDb()
    .select({ id: vendors.id, shopName: vendors.shopName })
    .from(vendors)
    .where(eq(vendors.userId, auth.id));

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

  // Tell the buyer. This runs only after the update worked, and a mail problem
  // must never undo or block the accept or reject.
  try {
    const [buyer] = await getDb()
      .select({ email: users.email })
      .from(orders)
      .innerJoin(users, eq(orders.buyerId, users.id))
      .where(vendorOrderScope(vendor.id, orderId));

    if (buyer) {
      await sendOrderStatusEmail({
        to: buyer.email,
        orderId,
        status: nextStatus,
        shopName: vendor.shopName,
      });
    }
  } catch (error) {
    console.error("Order status email failed:", error);
  }

  return {
    ok: true,
    message:
      nextStatus === "accepted"
        ? "Order accepted."
        : "Order rejected. The buyer will be refunded by the admin.",
  };
}

export async function acceptOrder(orderId: string): Promise<Result> {
  return changeOrderStatus(orderId, "accepted");
}

export async function rejectOrder(orderId: string): Promise<Result> {
  return changeOrderStatus(orderId, "rejected");
}
