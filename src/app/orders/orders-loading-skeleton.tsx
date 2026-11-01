import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ordersPageCopy } from "@/lib/orders/page-copy";

export function OrdersLoadingSkeleton() {
  return (
    <div
      aria-label={ordersPageCopy.loadingLabel}
      aria-busy="true"
      className="flex flex-col gap-4"
    >
      <div aria-hidden="true" className="flex flex-col gap-4">
        {[0, 1, 2].map((skeleton) => (
          <Card key={skeleton}>
            <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="h-6 w-40 max-w-full animate-pulse rounded bg-muted" />
              <div className="h-7 w-28 animate-pulse rounded-full bg-muted" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-4 w-56 max-w-full animate-pulse rounded bg-muted" />
              <div className="flex justify-between gap-4">
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                <div className="h-5 w-28 animate-pulse rounded bg-muted" />
              </div>
              <div className="h-12 w-full animate-pulse rounded-md bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
