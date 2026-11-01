import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDateTimeLagos, formatNaira } from "@/lib/orders/format";
import { ordersPageCopy } from "@/lib/orders/page-copy";
import { requireRole } from "@/lib/auth/guard";
import { getBuyerOrderById } from "@/lib/orders/queries";
import { orderStatusCopy } from "@/lib/orders/status-copy";
import { OrdersLoadingSkeleton } from "@/app/orders/orders-loading-skeleton";

const progressSteps = ["paid", "accepted", "picked_up", "delivered"] as const;

const completedStepsByStatus = {
  pending: 0,
  paid: 1,
  accepted: 2,
  rejected: 0,
  picked_up: 3,
  delivered: 4,
  cancelled: 0,
} as const;

type OrderStatus = keyof typeof orderStatusCopy;
type OrderRouteParams = PageProps<"/orders/[id]">["params"];

export const instant = false;

export default async function OrderDetailPage({
  params,
}: { params: OrderRouteParams }) {
  const user = await requireRole("buyer");

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10">
      <div>
        <Button asChild variant="link" className="h-auto px-0 text-sm">
          <Link href="/orders">{ordersPageCopy.backToOrders}</Link>
        </Button>
      </div>

      <header className="space-y-2">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {ordersPageCopy.detailTitle}
        </h1>
      </header>
      <Suspense fallback={<OrdersLoadingSkeleton />}>
        <BuyerOrderDetails params={params} buyerId={user.id} />
      </Suspense>
    </main>
  );
}

async function BuyerOrderDetails({
  params,
  buyerId,
}: { params: OrderRouteParams; buyerId: string }) {
  const { id } = await params;
  const order = await getBuyerOrderById(buyerId, id);

  if (!order) {
    notFound();
  }

  const statusCopy = orderStatusCopy[order.status];
  const rejectedOrCancelled = order.status === "rejected" || order.status === "cancelled";
  const completedSteps = completedStepsByStatus[order.status as OrderStatus];
  const currentStepIndex = completedSteps - 1;

  return (
    <>
      <p className="text-base font-semibold text-foreground">{order.shopName}</p>
      <Card>
        {rejectedOrCancelled ? (
          <CardContent className="pt-4">
            <div
              className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive"
              role="alert"
            >
              <p className="font-semibold">{statusCopy.title}</p>
              <p className="mt-1 text-sm leading-6">{statusCopy.message}</p>
            </div>
          </CardContent>
        ) : (
          <>
            <CardHeader>
              <CardTitle>{ordersPageCopy.statusHeading}: {statusCopy.title}</CardTitle>
              <p className="text-sm leading-6 text-muted-foreground">{statusCopy.message}</p>
            </CardHeader>
            <CardContent>
              <ol
                aria-label={ordersPageCopy.progressHeading}
                className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-4 sm:gap-x-2"
              >
                {progressSteps.map((step, index) => {
                  const isComplete = index < completedSteps;
                  const isCurrent = index === currentStepIndex;
                  const stepLabel = step === "paid"
                    ? ordersPageCopy.paidStepLabel
                    : orderStatusCopy[step].title;
                  const stepState = isCurrent
                    ? ordersPageCopy.currentStep
                    : isComplete
                      ? ordersPageCopy.completeStep
                      : ordersPageCopy.upcomingStep;

                  return (
                    <li
                      key={step}
                      aria-current={isCurrent ? "step" : undefined}
                      aria-label={`${stepLabel}: ${stepState}`}
                      className="relative flex min-w-0 flex-col items-center gap-2 text-center"
                    >
                      {index > 0 && (
                        <span
                          aria-hidden="true"
                          className={`absolute right-1/2 top-4 z-0 hidden h-0.5 w-full sm:block ${isComplete ? "bg-primary" : "bg-border"}`}
                        />
                      )}
                      <span
                        aria-hidden="true"
                        className={`relative z-10 flex size-8 items-center justify-center rounded-full border text-sm font-bold ${
                          isComplete
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-muted text-muted-foreground"
                        } ${isCurrent ? "ring-2 ring-accent ring-offset-2 ring-offset-background" : ""}`}
                      >
                        {isComplete ? "✓" : index + 1}
                      </span>
                      <span className="text-sm font-semibold leading-5 text-foreground">{stepLabel}</span>
                      <span className="text-xs font-medium text-muted-foreground">{stepState}</span>
                      {step === "paid" && order.paidAt && (
                        <time
                          className="text-xs text-muted-foreground"
                          dateTime={order.paidAt.toISOString()}
                        >
                          {formatDateTimeLagos(order.paidAt)}
                        </time>
                      )}
                      {step === "picked_up" && order.pickedUpAt && (
                        <time
                          className="text-xs text-muted-foreground"
                          dateTime={order.pickedUpAt.toISOString()}
                        >
                          {formatDateTimeLagos(order.pickedUpAt)}
                        </time>
                      )}
                      {step === "delivered" && order.deliveredAt && (
                        <time
                          className="text-xs text-muted-foreground"
                          dateTime={order.deliveredAt.toISOString()}
                        >
                          {formatDateTimeLagos(order.deliveredAt)}
                        </time>
                      )}
                    </li>
                  );
                })}
              </ol>
            </CardContent>
          </>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{ordersPageCopy.itemsHeading}</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <p className="font-medium text-foreground">{item.productName}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {ordersPageCopy.quantityLabel}: {item.quantity}
                </p>
              </div>
              <p className="shrink-0 text-right font-medium text-foreground">
                <span className="block text-xs font-normal text-muted-foreground">
                  {ordersPageCopy.itemPriceLabel}
                </span>
                {formatNaira(item.unitPriceKobo)}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{ordersPageCopy.deliveryHeading}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <p className="text-foreground">{order.deliveryAddress}</p>
          <p className="text-sm text-muted-foreground">
            {ordersPageCopy.areaLabel}: {order.deliveryArea}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 py-5">
          <TotalRow label={ordersPageCopy.subtotalLabel} amountKobo={order.subtotalKobo} />
          <TotalRow label={ordersPageCopy.deliveryFeeLabel} amountKobo={order.deliveryFeeKobo} />
          <TotalRow label={ordersPageCopy.serviceFeeLabel} amountKobo={order.platformFeeKobo} />
          <div className="border-t border-border pt-3">
            <TotalRow label={ordersPageCopy.totalLabel} amountKobo={order.totalKobo} emphasized />
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function TotalRow({
  label,
  amountKobo,
  emphasized = false,
}: {
  label: string;
  amountKobo: number;
  emphasized?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between gap-4 ${emphasized ? "text-base font-bold text-foreground" : "text-sm text-muted-foreground"}`}>
      <span>{label}</span>
      <span className={emphasized ? "text-primary" : "font-medium text-foreground"}>
        {formatNaira(amountKobo)}
      </span>
    </div>
  );
}
