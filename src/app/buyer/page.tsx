import type { Metadata } from "next";
import Link from "next/link";

import { and, eq } from "drizzle-orm";

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
import { getDb } from "@/lib/db";
import { identityVerifications } from "@/lib/db/schema";
import { users } from "@/lib/auth/schema";
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

  const db = getDb();
  const [[profile], [identityRow]] = await Promise.all([
    db
      .select({ phoneVerifiedAt: users.phoneVerifiedAt })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1),
    db
      .select({ id: identityVerifications.id })
      .from(identityVerifications)
      .where(
        and(
          eq(identityVerifications.userId, user.id),
          eq(identityVerifications.kind, "nin"),
          eq(identityVerifications.status, "verified"),
        ),
      )
      .limit(1),
  ]);

  const phoneVerified = Boolean(profile?.phoneVerifiedAt);
  const identityVerified = Boolean(identityRow);

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
          <CardTitle>{phoneVerified ? "Your account is verified ✓" : "Verify your phone to start ordering"}</CardTitle>
          <CardDescription>
            {phoneVerified
              ? "Your phone number is verified, so you can order any amount — there are no spending caps on OjaLink."
              : "Your account can browse the marketplace until your phone number is verified. It takes about a minute."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {identityVerified && (
            <p className="text-sm font-medium text-green-900">Identity (NIN) verified ✓</p>
          )}
          {!phoneVerified && (
            <Button asChild className="w-full sm:w-auto">
              <Link href="/buyer/verify">Verify your phone number</Link>
            </Button>
          )}
        </CardContent>
      </Card>

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
