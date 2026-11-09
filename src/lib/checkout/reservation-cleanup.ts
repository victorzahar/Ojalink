import { and, eq, lte } from "drizzle-orm";

import { getDb, getTransactionalDb } from "@/lib/db";
import { orders, payments, stockReservations } from "@/lib/db/schema";

export async function releaseExpiredStockReservations(now = new Date()) {
  const expired = await getDb()
    .selectDistinct({ orderId: stockReservations.orderId })
    .from(stockReservations)
    .where(and(
      eq(stockReservations.status, "reserved"),
      lte(stockReservations.expiresAt, now),
    ))
    .limit(100);

  let releasedCount = 0;
  for (const { orderId } of expired) {
    releasedCount += await getTransactionalDb().transaction(async (tx) => {
      const [payment] = await tx
        .select({
          id: payments.id,
          paymentStatus: payments.status,
          orderStatus: orders.status,
        })
        .from(payments)
        .innerJoin(orders, eq(payments.orderId, orders.id))
        .where(eq(orders.id, orderId))
        .for("update")
        .limit(1);
      if (!payment || payment.paymentStatus !== "pending" || payment.orderStatus !== "pending") return 0;

      const released = await tx.update(stockReservations)
        .set({ status: "released", updatedAt: now })
        .where(and(
          eq(stockReservations.orderId, orderId),
          eq(stockReservations.status, "reserved"),
          lte(stockReservations.expiresAt, now),
        ))
        .returning({ id: stockReservations.id });
      if (released.length === 0) return 0;

      await tx.update(payments)
        .set({ status: "failed", updatedAt: now })
        .where(and(eq(payments.id, payment.id), eq(payments.status, "pending")));
      await tx.update(orders)
        .set({ status: "cancelled", updatedAt: now })
        .where(and(eq(orders.id, orderId), eq(orders.status, "pending")));
      return released.length;
    });
  }

  return releasedCount;
}
