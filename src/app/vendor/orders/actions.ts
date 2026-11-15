"use server";

import { and, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/guard";
import { getDb, getTransactionalDb } from "@/lib/db";
import {
  orders,
  payments,
  products,
  stockReservations,
  users,
  vendors,
} from "@/lib/db/schema";
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
  try {
    const changed = await getTransactionalDb().transaction(async (tx) => {
      const [order] = await tx
        .select({ id: orders.id })
        .from(orders)
        .where(and(vendorOrderScope(vendor.id, orderId), eq(orders.status, "paid")))
        .for("update")
        .limit(1);

      if (!order) return false;

      if (nextStatus === "rejected") {
        const reservations = await tx
          .select({
            productId: stockReservations.productId,
            quantity: stockReservations.quantity,
          })
          .from(stockReservations)
          .where(
            and(
              eq(stockReservations.orderId, orderId),
              eq(stockReservations.status, "consumed"),
            ),
          );

        const productIds = [
          ...new Set(
            reservations.flatMap((item) => (item.productId ? [item.productId] : [])),
          ),
        ].sort();

        if (productIds.length > 0) {
          await tx
            .select({ id: products.id })
            .from(products)
            .where(inArray(products.id, productIds))
            .orderBy(products.id)
            .for("update");

          for (const item of reservations) {
            if (!item.productId) continue;
            await tx
              .update(products)
              .set({
                stockQuantity: sql`${products.stockQuantity} + ${item.quantity}`,
              })
              .where(eq(products.id, item.productId));
          }
        }

        await tx
          .update(stockReservations)
          .set({ status: "released", updatedAt: new Date() })
          .where(
            and(
              eq(stockReservations.orderId, orderId),
              eq(stockReservations.status, "consumed"),
            ),
          );
      }

      await tx
        .update(orders)
        .set({ status: nextStatus, updatedAt: new Date() })
        .where(and(vendorOrderScope(vendor.id, orderId), eq(orders.status, "paid")));

      if (nextStatus === "rejected") {
        await tx
          .update(payments)
          .set({ refundReviewRequired: true, updatedAt: new Date() })
          .where(and(eq(payments.orderId, orderId), eq(payments.status, "success")));
      }

      return true;
    });

    if (!changed) return { ok: false, message: CANT_CHANGE };
  } catch {
    return { ok: false, message: "We couldn't update this order. Please try again." };
  }

  revalidatePath("/vendor/orders");

  // NEW: tell the buyer. This runs only after the update worked, and a mail
  // problem must never undo or block the accept or reject.
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
