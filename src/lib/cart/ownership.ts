import { and, eq } from "drizzle-orm";

import { carts } from "@/lib/db/schema";

/** Ownership always comes from the authenticated buyer, never a browser cart id. */
export function buyerCartScope(buyerId: string, cartId?: string) {
  return cartId
    ? and(eq(carts.buyerId, buyerId), eq(carts.id, cartId))
    : eq(carts.buyerId, buyerId);
}

export function cartBelongsToBuyer(cartBuyerId: string, buyerId: string) {
  return cartBuyerId === buyerId;
}
