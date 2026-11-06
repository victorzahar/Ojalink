import "server-only";

import { and, eq, gt, inArray, min, sum } from "drizzle-orm";

import { getDb, getTransactionalDb } from "@/lib/db";
import { cartItems, carts, orderItems, orders, payments, products, stockReservations, vendors } from "@/lib/db/schema";
import { users } from "@/lib/auth/schema";
import { buyerCartScope } from "@/lib/cart/ownership";
import { buyerOrderScope } from "@/lib/orders/ownership";
import { calculateCheckoutTotals } from "@/lib/checkout/pricing";
import { CHECKOUT_STOCK_HOLD_MS, getAvailableStock } from "@/lib/checkout/stock";

export type CheckoutResult =
  | { success: true; orderId: string }
  | { success: false; message: string };

export async function createCheckoutOrder(
  buyerId: string,
  deliveryAddress: string,
  deliveryArea: string,
): Promise<CheckoutResult> {
  return getTransactionalDb().transaction(async (tx) => {
    const [cart] = await tx
      .select({ id: carts.id, vendorId: carts.vendorId })
      .from(carts)
      .where(buyerCartScope(buyerId))
      .for("update")
      .limit(1);

    if (!cart) return { success: false, message: "Your cart is empty." };

    const lines = await tx
      .select({
        productId: products.id,
        vendorId: products.vendorId,
        vendorApprovalStatus: vendors.approvalStatus,
        productName: products.name,
        priceKobo: products.priceKobo,
        quantity: cartItems.quantity,
        stockQuantity: products.stockQuantity,
        isAvailable: products.isAvailable,
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .innerJoin(vendors, eq(products.vendorId, vendors.id))
      .where(eq(cartItems.cartId, cart.id))
      .for("update");

    if (lines.length === 0) return { success: false, message: "Your cart is empty." };

    const reservedRows = await tx
      .select({
        productId: stockReservations.productId,
        quantity: sum(stockReservations.quantity),
      })
      .from(stockReservations)
      .where(and(
        inArray(stockReservations.productId, lines.map((line) => line.productId)),
        eq(stockReservations.status, "reserved"),
        gt(stockReservations.expiresAt, new Date()),
      ))
      .groupBy(stockReservations.productId);
    const reservedByProduct = new Map(
      reservedRows.flatMap((row) => row.productId
        ? [[row.productId, Number(row.quantity ?? 0)] as const]
        : []),
    );
    if (!cart.vendorId || lines.some((line) => line.vendorId !== cart.vendorId)) {
      return { success: false, message: "Your cart needs to contain items from one shop." };
    }
    if (lines.some((line) => line.vendorApprovalStatus !== "approved")) {
      return { success: false, message: "A shop in your cart is no longer approved." };
    }
    if (lines.some((line) =>
      !line.isAvailable ||
      getAvailableStock(line.stockQuantity, reservedByProduct.get(line.productId) ?? 0) < line.quantity
    )) {
      return { success: false, message: "A cart item is unavailable or no longer has enough stock. Update your cart and try again." };
    }

    let totals: ReturnType<typeof calculateCheckoutTotals>;
    try {
      totals = calculateCheckoutTotals(lines.map((line) => ({
        priceKobo: line.priceKobo,
        quantity: line.quantity,
      })));
    } catch {
      return { success: false, message: "We couldn't calculate your order total. Please contact support." };
    }

    const [order] = await tx
      .insert(orders)
      .values({
        buyerId,
        vendorId: cart.vendorId,
        deliveryAddress,
        deliveryArea,
        ...totals,
        status: "pending",
      })
      .returning({ id: orders.id });

    const reservationExpiresAt = new Date(Date.now() + CHECKOUT_STOCK_HOLD_MS);
    await tx.insert(stockReservations).values(lines.map((line) => ({
      orderId: order.id,
      productId: line.productId,
      quantity: line.quantity,
      status: "reserved" as const,
      expiresAt: reservationExpiresAt,
    })));

    await tx.insert(orderItems).values(lines.map((line) => ({
      orderId: order.id,
      productId: line.productId,
      productName: line.productName,
      unitPriceKobo: line.priceKobo,
      quantity: line.quantity,
    })));

    const reference = "ojalink_" + crypto.randomUUID().replaceAll("-", "");
    await tx.insert(payments).values({
      orderId: order.id,
      paystackReference: reference,
      amountKobo: totals.totalKobo,
      status: "pending",
    });

    await tx.delete(cartItems).where(eq(cartItems.cartId, cart.id));
    await tx
      .update(carts)
      .set({ vendorId: null, updatedAt: new Date() })
      .where(and(eq(carts.id, cart.id), eq(carts.buyerId, buyerId)));

    return { success: true, orderId: order.id };
  });
}

export async function getBuyerCheckoutOrder(buyerId: string, orderId: string) {
  const db = getDb();
  const [order] = await db
    .select({
      id: orders.id,
      shopName: vendors.shopName,
      status: orders.status,
      deliveryAddress: orders.deliveryAddress,
      deliveryArea: orders.deliveryArea,
      subtotalKobo: orders.subtotalKobo,
      deliveryFeeKobo: orders.deliveryFeeKobo,
      platformFeeKobo: orders.platformFeeKobo,
      totalKobo: orders.totalKobo,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .innerJoin(vendors, eq(orders.vendorId, vendors.id))
    .where(buyerOrderScope(buyerId, orderId))
    .limit(1);
  if (!order) return null;

  const [items, [payment]] = await Promise.all([
    db
      .select({
        name: orderItems.productName,
        unitPriceKobo: orderItems.unitPriceKobo,
        quantity: orderItems.quantity,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(buyerOrderScope(buyerId, orderId)),
    db
      .select({ status: payments.status })
      .from(payments)
      .innerJoin(orders, eq(payments.orderId, orders.id))
      .where(buyerOrderScope(buyerId, orderId))
      .limit(1),
  ]);

  const [reservation] = await db
    .select({ expiresAt: min(stockReservations.expiresAt) })
    .from(stockReservations)
    .where(and(
      eq(stockReservations.orderId, orderId),
      eq(stockReservations.status, "reserved"),
    ));

  return {
    ...order,
    items,
    paymentStatus: payment?.status ?? "pending",
    reservationExpiresAt: reservation?.expiresAt ?? null,
    reservationExpired:
      order.status === "pending" &&
      (!reservation?.expiresAt || reservation.expiresAt.getTime() <= Date.now()),
  };
}

export async function getBuyerPaymentInitializationData(buyerId: string, orderId: string) {
  const [row] = await getDb()
    .select({
      id: orders.id,
      status: orders.status,
      totalKobo: orders.totalKobo,
      reference: payments.paystackReference,
      paymentStatus: payments.status,
      email: users.email,
    })
    .from(orders)
    .innerJoin(payments, eq(payments.orderId, orders.id))
    .innerJoin(users, eq(users.id, orders.buyerId))
    .where(buyerOrderScope(buyerId, orderId))
    .limit(1);
  if (!row) return null;

  const [reservation] = await getDb()
    .select({ expiresAt: min(stockReservations.expiresAt) })
    .from(stockReservations)
    .where(and(
      eq(stockReservations.orderId, orderId),
      eq(stockReservations.status, "reserved"),
    ));

  return { ...row, reservationExpiresAt: reservation?.expiresAt ?? null };
}
