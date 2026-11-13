import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, PackageCheck, ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/guard";
import { formatDateLagos, formatNaira } from "@/lib/orders/format";
import { getBuyerOrders } from "@/lib/orders/queries";
import { orderStatusCopy } from "@/lib/orders/status-copy";

export const instant = false;

export const metadata: Metadata = {
  title: "My account · OjaLink",
  description: "View your OjaLink orders, payment status and delivery details.",
};

const orderStatusStyles: Record<keyof typeof orderStatusCopy, string> = {
  pending: "bg-amber-100 text-amber-900",
  paid: "bg-emerald-100 text-emerald-900",
  accepted: "bg-emerald-100 text-emerald-900",
  rejected: "bg-red-100 text-red-900",
  picked_up: "bg-blue-100 text-blue-900",
  delivered: "bg-emerald-100 text-emerald-900",
  cancelled: "bg-muted text-foreground",
  refunded: "bg-muted text-foreground",
};

export default async function BuyerPage() {
  const user = await requireRole("buyer");
  const orders = await getBuyerOrders(user.id);
  const paidOrders = orders.filter((order) => order.paymentStatus === "success").length;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
      <header className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div>
          <p className="text-sm font-semibold text-primary">My OjaLink</p>
          <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            Welcome, {user.name}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">Your orders, payments and delivery details in one place.</p>
        </div>
        <Button asChild className="min-h-12 w-full sm:w-auto">
          <Link href="/marketplace">Continue shopping <ArrowRight className="ml-2 size-4" /></Link>
        </Button>
      </header>

      <section aria-label="Account overview" className="grid grid-cols-2 gap-3 sm:gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4 sm:p-5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><ShoppingBag aria-hidden="true" className="size-5" /></span>
            <div><p className="text-sm text-muted-foreground">Orders</p><p className="text-xl font-bold">{orders.length}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4 sm:p-5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><PackageCheck aria-hidden="true" className="size-5" /></span>
            <div><p className="text-sm text-muted-foreground">Paid</p><p className="text-xl font-bold">{paidOrders}</p></div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4" aria-labelledby="account-orders-title">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 id="account-orders-title" className="font-heading text-xl font-bold">Your orders</h2>
            <p className="mt-1 text-sm text-muted-foreground">Payment and delivery progress for each order.</p>
          </div>
          <Link href="/orders" className="text-sm font-semibold text-primary hover:underline">Order history</Link>
        </div>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-start gap-4 p-5 sm:p-7">
              <p className="text-base">You haven’t placed an order yet. Browse the marketplace to get started.</p>
              <Button asChild className="min-h-12"><Link href="/marketplace">Browse marketplace</Link></Button>
            </CardContent>
          </Card>
        ) : (
          <ul className="grid gap-4">
            {orders.map((order) => (
              <li key={order.id}>
                <Card className="gap-0 overflow-hidden">
                  <CardHeader className="gap-3 pb-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <CardTitle className="text-base sm:text-lg">{order.shopName}</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">{order.itemsSummary}</p>
                    </div>
                    <span className={`inline-flex min-h-8 w-fit items-center rounded-full px-3 py-1 text-sm font-semibold ${orderStatusStyles[order.status]}`}>
                      {orderStatusCopy[order.status].title}
                    </span>
                  </CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Payment</p>
                      <p className="mt-1 font-semibold">{order.paymentStatus === "success" ? "Paid" : order.paymentStatus === "failed" ? "Failed" : "Awaiting payment"}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{formatNaira(order.totalKobo)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Deliver to</p>
                      <p className="mt-1 text-sm font-medium">{order.deliveryArea}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{order.deliveryAddress}</p>
                    </div>
                    <div className="flex flex-col justify-between gap-3 sm:items-end">
                      <time className="text-sm text-muted-foreground" dateTime={order.createdAt.toISOString()}>{formatDateLagos(order.createdAt)}</time>
                      <Button asChild variant="outline" className="min-h-11 w-full sm:w-auto">
                        <Link href={`/orders/${order.id}`}>View delivery status <ArrowRight className="ml-2 size-4" /></Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
