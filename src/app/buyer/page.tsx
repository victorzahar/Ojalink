import type { Metadata } from "next";
import Link from "next/link";

import { LogoutButton } from "@/components/auth/logout-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireRole } from "@/lib/auth/guard";
import { getBuyerCart } from "@/lib/cart/queries";
import { formatNaira } from "@/lib/orders/format";

// This page reads the session, cart and orders state on every request. Block
// on the server so protected content is never served from a static shell.
export const instant = false;

export const metadata: Metadata = {
  title: "Buyer area · OjaLink",
  description: "Your OjaLink buyer area: orders, cart and shopping.",
};

export default async function BuyerPage() {
  const user = await requireRole("buyer");
  const cart = await getBuyerCart(user.id);

  const cartItemCount = cart.items.reduce((total, item) => total + item.quantity, 0);

  const quickLinks = [
    {
      href: "/marketplace",
      title: "Browse the marketplace",
      description: "Shop products from approved vendors across Benin City markets.",
    },
    {
      href: "/cart",
      title: cartItemCount > 0 ? `Your cart — ${cartItemCount} item${cartItemCount === 1 ? "" : "s"}` : "Your cart",
      description:
        cartItemCount > 0
          ? `${formatNaira(cart.subtotalKobo)} ready for checkout${cart.vendorName ? ` from ${cart.vendorName}` : ""}.`
          : "Nothing in your cart yet. Find something you like in the marketplace.",
    },
    {
      href: "/orders",
      title: "My orders",
      description: "Track your payments, deliveries and refunds.",
    },
  ];

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <header className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">Buyer area</p>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Welcome, {user.name}
        </h1>
        <p className="text-base text-muted-foreground">
          Signed in as {user.email}
        </p>
      </header>

      <section aria-label="Buyer shortcuts" className="grid gap-4 sm:grid-cols-3">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-xl border border-border bg-card p-5 outline-none transition-colors hover:border-primary/40 focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <p className="font-heading text-lg font-semibold text-foreground">{link.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{link.description}</p>
          </Link>
        ))}
      </section>

      <Card size="sm">
        <CardHeader>
          <CardTitle>Join the other side of OjaLink</CardTitle>
          <CardDescription>
            You can also apply to sell or deliver. An admin reviews every application.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href="/vendor/apply">Become a vendor</Link>
            </Button>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href="/rider/apply">Become a rider</Link>
            </Button>
          </div>
          <LogoutButton className="w-full sm:w-auto" />
        </CardContent>
      </Card>
    </main>
  );
}
