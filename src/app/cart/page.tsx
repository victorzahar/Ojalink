import type { Metadata } from "next";

import { CartView } from "@/components/cart/cart-view";
import { requireCartBuyer } from "@/lib/cart/access";
import { getBuyerCart } from "@/lib/cart/queries";

export const metadata: Metadata = {
  title: "Your cart | OjaLink",
  description: "Review the products in your OjaLink shopping cart.",
};

export default async function CartPage() {
  const buyer = await requireCartBuyer();
  const cart = await getBuyerCart(buyer.id);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10">
      <header className="space-y-1">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Your cart
        </h1>
        <p className="text-base text-muted-foreground">
          Review your items and quantities before checkout.
        </p>
      </header>
      <CartView cart={cart} />
    </main>
  );
}
