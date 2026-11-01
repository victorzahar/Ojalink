import { and, eq } from "drizzle-orm";

import { orders } from "@/lib/db/schema";

export function buyerOrdersScope(buyerId: string) {
  return eq(orders.buyerId, buyerId);
}

export function buyerOrderScope(buyerId: string, orderId: string) {
  return and(eq(orders.id, orderId), eq(orders.buyerId, buyerId))!;
}
