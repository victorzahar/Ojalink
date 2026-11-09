import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CartItemRow } from "@/components/cart/cart-item-row";
import { formatNaira } from "@/lib/orders/format";
import type { BuyerCart } from "@/lib/cart/queries";

export function CartView({ cart }: { cart: BuyerCart }) {
  if (cart.items.length === 0) {
    return (
      <Card className="rounded-xl border-dashed">
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center sm:p-12">
          <div className="space-y-2">
            <h2 className="font-heading text-xl font-bold">Your cart</h2>
            <p className="text-base text-muted-foreground">
              Your cart is empty. Browse vendors.
            </p>
          </div>
          <Button asChild className="h-12 w-full sm:w-auto">
            <Link href="/marketplace">Browse vendors</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section aria-label="Cart items" className="space-y-4">
        {cart.vendorName && (
          <p className="text-base text-muted-foreground">Shopping from {cart.vendorName}</p>
        )}
        {cart.items.map((item) => (
          <CartItemRow key={item.productId} item={item} />
        ))}
      </section>

      <aside aria-label="Cart summary">
        <Card className="rounded-xl">
          <CardContent className="space-y-4 p-5">
            <h2 className="font-heading text-xl font-bold">Order summary</h2>
            <div className="flex justify-between gap-4 text-base">
              <span>Subtotal</span>
              <span className="font-semibold">{formatNaira(cart.subtotalKobo)}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Delivery and platform fees are shown before you place the order.
            </p>
            <Button asChild className="h-12 w-full">
              <Link href="/checkout">Continue to checkout</Link>
            </Button>
            <Button asChild variant="outline" className="h-12 w-full">
              <Link href="/marketplace">Continue shopping</Link>
            </Button>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
