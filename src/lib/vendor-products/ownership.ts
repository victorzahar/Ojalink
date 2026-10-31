import { and, eq } from "drizzle-orm";

import { products } from "@/lib/db/schema";

export function vendorProductsScope(vendorId: string) {
  return eq(products.vendorId, vendorId);
}

export function vendorProductScope(vendorId: string, productId: string) {
  return and(eq(products.id, productId), eq(products.vendorId, vendorId))!;
}
