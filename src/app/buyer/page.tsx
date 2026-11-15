import type { Metadata } from "next";
import Link from "next/link";

import { and, count, eq } from "drizzle-orm";

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
import { identityVerifications, orders } from "@/lib/db/schema";
import { users } from "@/lib/auth/schema";
import { formatNaira } from "@/lib/orders/format";
import {
  GOOD_HISTORY_DELIVERED_ORDERS,
  TIER_LIMITS,
  computeBuyerTier,
  type BuyerTier,
} from "@/lib/verification/tier";

// This page reads the session, cart and orders state on every request. Block
// on the server so protected content is never served from a static shell.
export const instant = false;

export const metadata: Metadata = {
  title: "Buyer area · OjaLink",
  description: "Your OjaLink buyer area: orders, cart and shopping.",
};

const tierCopy: Record<BuyerTier, { title: string; description: string }> = {
  0: {
    title: "Verify your phone to start ordering",
    description:
      "Your account is browse-only until your phone number is verified. It takes about a minute.",
  },
  1: {
    title: "Tier 1 — phone verified",
    description:
      "You can order up to ₦50,000 per order and ₦100,000 in any 7 days. Verify your identity (NIN) to raise the limits.",
  },
  2: {
    title: "Tier 2 — identity verified",
    description:
      "You can order up to ₦500,000 per order and ₦1,000,000 in any 7 days. That is the highest level.",
  },
};

export default async function BuyerPage() {
  const user = await requireRole("buyer");
  const cart = await getBuyerCart(user.id);

  const db = getDb();
  const [[profile], [identityRow], [deliveredRow]] = await Promise.all([
    db
      .select({
        emailVerified: users.emailVerified,
        phoneVerifiedAt: users.phoneVerifiedAt,
      })
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
    db
      .select({ total: count() })
      .from(orders)
      .where(and(eq(orders.buyerId, user.id), eq(orders.status, "delivered"))),
  ]);

  const tier = computeBuyerTier({
    emailVerified: profile?.emailVerified ?? false,
    phoneVerifiedAt: profile?.phoneVerifiedAt ?? null,
    hasVerifiedIdentity: Boolean(identityRow),
    deliveredOrderCount: Number(deliveredRow?.total ?? 0),
  });
  const limits = TIER_LIMITS[tier];
  const deliveredCount = Number(deliveredRow?.total ?? 0);

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
          <CardTitle>{tierCopy[tier].title}</CardTitle>
          <CardDescription>{tierCopy[tier].description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Per-order limit</dt>
              <dd className="font-medium text-foreground">
                {limits.perOrderKobo === 0 ? "Browse only" : formatNaira(limits.perOrderKobo)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">7-day limit</dt>
              <dd className="font-medium text-foreground">
                {limits.weeklyKobo === 0 ? "—" : formatNaira(limits.weeklyKobo)}
              </dd>
            </div>
            {tier === 1 && (
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Delivered orders toward Tier 2</dt>
                <dd className="font-medium text-foreground">
                  {deliveredCount} of {GOOD_HISTORY_DELIVERED_ORDERS}
                </dd>
              </div>
            )}
          </dl>
          {tier < 1 && (
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
