import { and, eq, inArray, sql } from "drizzle-orm";

import { getTransactionalDb } from "@/lib/db";
import { deliveries, orderItems, orders, payments, products, stockReservations, vendors } from "@/lib/db/schema";
import { isMatchingSuccessfulCharge, verifyPaystackSignature } from "@/lib/payments/signature";
import { canConsumeStockReservations } from "@/lib/checkout/stock";

type PaystackEvent = {
  event?: unknown;
  data?: {
    status?: unknown;
    currency?: unknown;
    reference?: unknown;
    amount?: unknown;
  };
};

export async function POST(request: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret || !secret.startsWith("sk_test_")) {
    return Response.json({ error: "Payment webhook is not configured." }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");
  if (!verifyPaystackSignature(rawBody, signature, secret)) {
    return Response.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  let event: PaystackEvent;
  try {
    event = JSON.parse(rawBody) as PaystackEvent;
  } catch {
    return Response.json({ error: "Invalid event payload." }, { status: 400 });
  }
  if (event.event !== "charge.success") return Response.json({ received: true });

  const data = event.data;
  const reference = data?.reference;
  if (!data || typeof reference !== "string") {
    return Response.json({ error: "Missing transaction reference." }, { status: 400 });
  }

  try {
    await getTransactionalDb().transaction(async (tx) => {
      const [payment] = await tx
        .select({
          id: payments.id,
          orderId: payments.orderId,
          reference: payments.paystackReference,
          amountKobo: payments.amountKobo,
          paymentStatus: payments.status,
          orderStatus: orders.status,
          orderTotalKobo: orders.totalKobo,
        })
        .from(payments)
        .innerJoin(orders, eq(payments.orderId, orders.id))
        .where(eq(payments.paystackReference, reference))
        .for("update")
        .limit(1);

      if (!payment) return;
      if (payment.paymentStatus === "success") return;

      if (!isMatchingSuccessfulCharge({
        event: event.event,
        status: data.status,
        currency: data.currency,
        reference: data.reference,
        expectedReference: payment.reference,
        amount: data.amount,
        expectedAmountKobo: payment.amountKobo,
      }) || data.amount !== payment.orderTotalKobo) {
        return;
      }
      const now = new Date();
      if (payment.paymentStatus === "failed" && payment.orderStatus === "cancelled") {
        await tx.update(payments)
          .set({ status: "success", paidAt: now, refundReviewRequired: true, updatedAt: now })
          .where(and(eq(payments.id, payment.id), eq(payments.status, "failed")));
        await tx.update(orders)
          .set({ status: "rejected", updatedAt: now })
          .where(and(eq(orders.id, payment.orderId), eq(orders.status, "cancelled")));
        return;
      }
      if (payment.paymentStatus !== "pending" || payment.orderStatus !== "pending") return;

      const items = await tx
        .select({ productId: orderItems.productId, quantity: orderItems.quantity })
        .from(orderItems)
        .where(eq(orderItems.orderId, payment.orderId));
      const expectedQuantities = new Map<string, number>();
      for (const item of items) {
        if (!item.productId) continue;
        expectedQuantities.set(
          item.productId,
          (expectedQuantities.get(item.productId) ?? 0) + item.quantity,
        );
      }
      const productIds = [...expectedQuantities.keys()].sort();
      const lockedProducts = productIds.length === 0
        ? []
        : await tx
            .select({
              id: products.id,
              stockQuantity: products.stockQuantity,
              isAvailable: products.isAvailable,
              vendorApprovalStatus: vendors.approvalStatus,
            })
            .from(products)
            .innerJoin(vendors, eq(products.vendorId, vendors.id))
            .where(inArray(products.id, productIds))
            .orderBy(products.id)
            .for("update");
      const lockedProductById = new Map(lockedProducts.map((product) => [product.id, {
        stockQuantity: product.stockQuantity,
        isAvailable: product.isAvailable,
        isVendorApproved: product.vendorApprovalStatus === "approved",
      }]));

      const reservations = await tx
        .select({
          productId: stockReservations.productId,
          quantity: stockReservations.quantity,
          status: stockReservations.status,
          expiresAt: stockReservations.expiresAt,
        })
        .from(stockReservations)
        .where(and(
          eq(stockReservations.orderId, payment.orderId),
          eq(stockReservations.status, "reserved"),
        ))
        .orderBy(stockReservations.productId)
        .for("update");
      const reservationsValid = items.length > 0 && productIds.length === items.length && canConsumeStockReservations(
        reservations,
        expectedQuantities,
        lockedProductById,
        now,
      );

      if (!reservationsValid) {
        if (reservations.length > 0) {
          await tx.update(stockReservations)
            .set({ status: "released", updatedAt: now })
            .where(and(
              eq(stockReservations.orderId, payment.orderId),
              eq(stockReservations.status, "reserved"),
            ));
        }
        await tx.update(payments)
          .set({ status: "success", paidAt: now, refundReviewRequired: true, updatedAt: now })
          .where(and(eq(payments.id, payment.id), eq(payments.status, "pending")));
        await tx.update(orders)
          .set({ status: "rejected", updatedAt: now })
          .where(and(eq(orders.id, payment.orderId), eq(orders.status, "pending")));
        return;
      }

      for (const [productId, quantity] of expectedQuantities) {
        await tx.update(products)
          .set({ stockQuantity: sql`${products.stockQuantity} - ${quantity}` })
          .where(eq(products.id, productId));
      }
      await tx.update(stockReservations)
        .set({ status: "consumed", updatedAt: now })
        .where(and(
          eq(stockReservations.orderId, payment.orderId),
          eq(stockReservations.status, "reserved"),
        ));

      await tx.update(payments)
        .set({ status: "success", paidAt: now, updatedAt: now })
        .where(and(eq(payments.id, payment.id), eq(payments.status, "pending")));
      await tx.update(orders)
        .set({ status: "paid", updatedAt: now })
        .where(and(eq(orders.id, payment.orderId), eq(orders.status, "pending")));
      await tx.insert(deliveries)
        .values({ orderId: payment.orderId, status: "available" })
        .onConflictDoNothing({ target: deliveries.orderId });
    });
  } catch {
    return Response.json({ error: "Webhook processing failed." }, { status: 500 });
  }

  return Response.json({ received: true });
}
