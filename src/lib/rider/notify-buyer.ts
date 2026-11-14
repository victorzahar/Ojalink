import "server-only";

import { and, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { deliveries, orders, users, vendors } from "@/lib/db/schema";
import { sendOrderStatusEmail } from "@/lib/orders/status-email";

/**
 * Tell the buyer that their order was picked up or delivered.
 *
 * Same pattern as the vendor accept/reject email: it runs only after the status
 * change worked, and a mail problem must never undo or block the rider's action,
 * so this function catches every error and never throws.
 *
 * The lookup is scoped to this rider's own delivery (delivery id AND rider id).
 */
export async function emailBuyerAboutStatus(
  deliveryId: string,
  riderId: string,
  status: "picked_up" | "delivered",
): Promise<void> {
  try {
    const [row] = await getDb()
      .select({
        email: users.email,
        orderId: orders.id,
        shopName: vendors.shopName,
      })
      .from(deliveries)
      .innerJoin(orders, eq(deliveries.orderId, orders.id))
      .innerJoin(vendors, eq(orders.vendorId, vendors.id))
      .innerJoin(users, eq(orders.buyerId, users.id))
      .where(and(eq(deliveries.id, deliveryId), eq(deliveries.riderId, riderId)));

    if (!row) return;

    await sendOrderStatusEmail({
      to: row.email,
      orderId: row.orderId,
      status,
      shopName: row.shopName,
    });
  } catch (error) {
    console.error("Order status email failed:", error);
  }
}
