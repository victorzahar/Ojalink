import "server-only";

import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm";

import { getDb } from "@/lib/db";
import {
  deliveries,
  markets,
  orderItems,
  orders,
  users,
  vendors,
} from "@/lib/db/schema";

/**
 * A job nobody has taken yet. Deliberately has NO buyer name, phone or street
 * address: a rider only sees those after accepting (CLAUDE.md security rules).
 */
export type AvailableJob = {
  deliveryId: string;
  shopName: string;
  marketName: string;
  marketArea: string;
  deliveryArea: string;
  deliveryFeeKobo: number;
  createdAt: Date;
};

/** A job this rider has accepted and is still carrying out. */
export type ActiveJob = {
  deliveryId: string;
  status: "accepted" | "picked_up";
  shopName: string;
  marketName: string;
  marketArea: string;
  buyerName: string;
  buyerPhone: string | null;
  deliveryAddress: string;
  deliveryArea: string;
  deliveryFeeKobo: number;
  itemsSummary: string;
  acceptedAt: Date | null;
  pickedUpAt: Date | null;
};

export type HistoryJob = {
  deliveryId: string;
  shopName: string;
  deliveryArea: string;
  deliveryFeeKobo: number;
  deliveredAt: Date | null;
};

/**
 * Jobs any rider can take: the payment went through and the vendor accepted the
 * order, but no rider has claimed the delivery yet.
 */
export async function getAvailableJobs(): Promise<AvailableJob[]> {
  return getDb()
    .select({
      deliveryId: deliveries.id,
      shopName: vendors.shopName,
      marketName: markets.name,
      marketArea: markets.area,
      deliveryArea: orders.deliveryArea,
      deliveryFeeKobo: orders.deliveryFeeKobo,
      createdAt: deliveries.createdAt,
    })
    .from(deliveries)
    .innerJoin(orders, eq(deliveries.orderId, orders.id))
    .innerJoin(vendors, eq(orders.vendorId, vendors.id))
    .innerJoin(markets, eq(vendors.marketId, markets.id))
    .where(
      and(
        eq(deliveries.status, "available"),
        isNull(deliveries.riderId),
        eq(orders.status, "accepted"),
      ),
    )
    .orderBy(asc(deliveries.createdAt));
}

/** This rider's own accepted / picked-up jobs. Always filtered by riderId. */
export async function getActiveJobs(riderId: string): Promise<ActiveJob[]> {
  const db = getDb();

  const rows = await db
    .select({
      deliveryId: deliveries.id,
      orderId: orders.id,
      status: deliveries.status,
      shopName: vendors.shopName,
      marketName: markets.name,
      marketArea: markets.area,
      buyerName: users.name,
      buyerPhone: users.phone,
      deliveryAddress: orders.deliveryAddress,
      deliveryArea: orders.deliveryArea,
      deliveryFeeKobo: orders.deliveryFeeKobo,
      acceptedAt: deliveries.acceptedAt,
      pickedUpAt: deliveries.pickedUpAt,
    })
    .from(deliveries)
    .innerJoin(orders, eq(deliveries.orderId, orders.id))
    .innerJoin(vendors, eq(orders.vendorId, vendors.id))
    .innerJoin(markets, eq(vendors.marketId, markets.id))
    .innerJoin(users, eq(orders.buyerId, users.id))
    .where(
      and(
        eq(deliveries.riderId, riderId),
        inArray(deliveries.status, ["accepted", "picked_up"]),
      ),
    )
    .orderBy(asc(deliveries.acceptedAt));

  if (rows.length === 0) {
    return [];
  }

  const items = await db
    .select({
      orderId: orderItems.orderId,
      productName: orderItems.productName,
      quantity: orderItems.quantity,
    })
    .from(orderItems)
    .where(
      inArray(
        orderItems.orderId,
        rows.map((row) => row.orderId),
      ),
    )
    .orderBy(orderItems.createdAt);

  const itemsByOrder = new Map<string, string[]>();
  for (const item of items) {
    const list = itemsByOrder.get(item.orderId) ?? [];
    list.push(`${item.quantity} × ${item.productName}`);
    itemsByOrder.set(item.orderId, list);
  }

  return rows.flatMap((row) => {
    // The query only returns accepted / picked_up; this keeps the type honest.
    if (row.status !== "accepted" && row.status !== "picked_up") {
      return [];
    }

    return [
      {
        deliveryId: row.deliveryId,
        status: row.status,
        shopName: row.shopName,
        marketName: row.marketName,
        marketArea: row.marketArea,
        buyerName: row.buyerName,
        buyerPhone: row.buyerPhone,
        deliveryAddress: row.deliveryAddress,
        deliveryArea: row.deliveryArea,
        deliveryFeeKobo: row.deliveryFeeKobo,
        itemsSummary: (itemsByOrder.get(row.orderId) ?? []).join(", ") || "No items",
        acceptedAt: row.acceptedAt,
        pickedUpAt: row.pickedUpAt,
      },
    ];
  });
}

/** This rider's finished deliveries, newest first. Always filtered by riderId. */
export async function getDeliveryHistory(riderId: string): Promise<HistoryJob[]> {
  return getDb()
    .select({
      deliveryId: deliveries.id,
      shopName: vendors.shopName,
      deliveryArea: orders.deliveryArea,
      deliveryFeeKobo: orders.deliveryFeeKobo,
      deliveredAt: deliveries.deliveredAt,
    })
    .from(deliveries)
    .innerJoin(orders, eq(deliveries.orderId, orders.id))
    .innerJoin(vendors, eq(orders.vendorId, vendors.id))
    .where(and(eq(deliveries.riderId, riderId), eq(deliveries.status, "delivered")))
    .orderBy(desc(deliveries.deliveredAt))
    .limit(50);
}
