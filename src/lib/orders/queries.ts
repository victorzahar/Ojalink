import "server-only";

import { and, desc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { deliveries, orderItems, orders, payments, vendors } from "@/lib/db/schema";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getBuyerOrders(buyerId: string) {
  const db = getDb();
  const buyerOrders = await db
    .select({
      id: orders.id,
      shopName: vendors.shopName,
      status: orders.status,
      totalKobo: orders.totalKobo,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .innerJoin(vendors, eq(orders.vendorId, vendors.id))
    .where(eq(orders.buyerId, buyerId))
    .orderBy(desc(orders.createdAt));

  if (buyerOrders.length === 0) {
    return [];
  }

  const buyerOrderItems = await db
    .select({ orderId: orderItems.orderId, productName: orderItems.productName })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(eq(orders.buyerId, buyerId))
    .orderBy(orderItems.createdAt);

  const itemsByOrder = new Map<string, string[]>();
  for (const item of buyerOrderItems) {
    const items = itemsByOrder.get(item.orderId) ?? [];
    items.push(item.productName);
    itemsByOrder.set(item.orderId, items);
  }

  return buyerOrders.map((order) => {
    const itemNames = itemsByOrder.get(order.id) ?? [];
    const firstItem = itemNames[0];

    return {
      ...order,
      itemsSummary: firstItem
        ? `${firstItem}${itemNames.length > 1 ? ` + ${itemNames.length - 1} more` : ""}`
        : "No items",
    };
  });
}

export async function getBuyerOrderById(buyerId: string, orderId: string) {
  if (!uuidPattern.test(orderId)) {
    return null;
  }

  const db = getDb();
  const [order] = await db
    .select({
      id: orders.id,
      status: orders.status,
      deliveryAddress: orders.deliveryAddress,
      deliveryArea: orders.deliveryArea,
      subtotalKobo: orders.subtotalKobo,
      deliveryFeeKobo: orders.deliveryFeeKobo,
      platformFeeKobo: orders.platformFeeKobo,
      totalKobo: orders.totalKobo,
      shopName: vendors.shopName,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .innerJoin(vendors, eq(orders.vendorId, vendors.id))
    .where(and(eq(orders.id, orderId), eq(orders.buyerId, buyerId)))
    .limit(1);

  if (!order) {
    return null;
  }

  const buyerOrderCondition = and(
    eq(orders.id, orderId),
    eq(orders.buyerId, buyerId),
  );

  const [items, [payment], [delivery]] = await Promise.all([
    db
      .select({
        id: orderItems.id,
        productName: orderItems.productName,
        unitPriceKobo: orderItems.unitPriceKobo,
        quantity: orderItems.quantity,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(buyerOrderCondition),
    db
      .select({ paidAt: payments.paidAt })
      .from(payments)
      .innerJoin(orders, eq(payments.orderId, orders.id))
      .where(buyerOrderCondition)
      .orderBy(desc(payments.createdAt))
      .limit(1),
    db
      .select({
        pickedUpAt: deliveries.pickedUpAt,
        deliveredAt: deliveries.deliveredAt,
      })
      .from(deliveries)
      .innerJoin(orders, eq(deliveries.orderId, orders.id))
      .where(buyerOrderCondition)
      .limit(1),
  ]);

  return {
    ...order,
    items,
    paidAt: payment?.paidAt ?? null,
    pickedUpAt: delivery?.pickedUpAt ?? null,
    deliveredAt: delivery?.deliveredAt ?? null,
  };
}
