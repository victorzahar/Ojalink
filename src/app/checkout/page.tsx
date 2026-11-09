import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { requireCartBuyer } from "@/lib/cart/access";
import { getBuyerCart } from "@/lib/cart/queries";

export const instant = false;

export const metadata: Metadata = {
  title: "Checkout | OjaLink",
  description: "Enter your delivery details and review your OjaLink order.",
};

export default async function CheckoutPage() {
  const buyer = await requireCartBuyer();
  const cart = await getBuyerCart(buyer.id);
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10">
      <header className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground"><Link href="/cart" className="underline">Your cart</Link> / Checkout</p>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Delivery details</h1>
        <p className="text-base text-muted-foreground">Choose where your order should be delivered.</p>
      </header>
      {cart.items.length === 0 ? (
        <section className="rounded-xl border border-dashed p-8 text-center">
          <h2 className="font-heading text-xl font-bold">Your cart is empty</h2>
          <p className="mt-2 text-base text-muted-foreground">Add items before checking out.</p>
          <Button asChild className="mt-4 h-12 w-full sm:w-auto"><Link href="/marketplace">Browse vendors</Link></Button>
        </section>
      ) : <CheckoutForm cart={cart} />}
    </main>
  );
}
