import Link from "next/link";
import { connection } from "next/server";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentBuyer } from "@/lib/orders/current-buyer";
import { formatDateLagos, formatNaira } from "@/lib/orders/format";
import { ordersPageCopy } from "@/lib/orders/page-copy";
import { getBuyerOrders } from "@/lib/orders/queries";
import { orderStatusCopy } from "@/lib/orders/status-copy";

const statusBadgeClasses: Record<keyof typeof orderStatusCopy, string> = {
  pending: "bg-accent/20 text-foreground",
  paid: "bg-muted text-foreground",
  accepted: "bg-muted text-foreground",
  rejected: "bg-destructive/10 text-destructive",
  picked_up: "bg-muted text-foreground",
  delivered: "bg-primary/10 text-primary",
  cancelled: "bg-destructive/10 text-destructive",
};

export default async function OrdersPage() {
  await connection();

  const buyer = await getCurrentBuyer();
  const orders = await getBuyerOrders(buyer.id);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
      <header className="space-y-2">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {ordersPageCopy.title}
        </h1>
        <p className="text-base text-muted-foreground">{ordersPageCopy.subtitle}</p>
      </header>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-start gap-5 py-6 sm:py-8">
            <p className="max-w-prose text-base leading-7 text-foreground">
              {ordersPageCopy.emptyMessage}
            </p>
            <Button asChild>
              <Link href="/">{ordersPageCopy.browseButton}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-4" aria-label={ordersPageCopy.title}>
          {orders.map((order) => (
            <li key={order.id}>
              <Card>
                <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <CardTitle className="text-lg font-semibold">{order.shopName}</CardTitle>
                  <span
                    className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-sm font-semibold ${statusBadgeClasses[order.status]}`}
                  >
                    {orderStatusCopy[order.status].title}
                  </span>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <p className="text-sm leading-6 text-muted-foreground">{order.itemsSummary}</p>
                  <div className="flex items-end justify-between gap-3">
                    <time
                      className="text-sm text-muted-foreground"
                      dateTime={order.createdAt.toISOString()}
                    >
                      {formatDateLagos(order.createdAt)}
                    </time>
                    <p className="text-right text-sm text-muted-foreground">
                      {ordersPageCopy.totalLabel}
                      <span className="mt-0.5 block text-base font-semibold text-foreground">
                        {formatNaira(order.totalKobo)}
                      </span>
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full">
                    <Link href={`/orders/${order.id}`}>{ordersPageCopy.trackOrderButton}</Link>
                  </Button>
                </CardFooter>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
