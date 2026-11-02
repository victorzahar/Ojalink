import { and, eq } from "drizzle-orm";

import { orders } from "@/lib/db/schema";

// All orders that belong to one vendor.
export function vendorOrdersScope(vendorId: string) {
  return eq(orders.vendorId, vendorId);
}

// One order, but only if it belongs to that vendor.
export function vendorOrderScope(vendorId: string, orderId: string) {
  return and(eq(orders.id, orderId), eq(orders.vendorId, vendorId))!;
}
