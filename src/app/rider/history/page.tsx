import type { Metadata } from "next";

import { RiderNav } from "@/components/rider/rider-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/guard";
import { formatDateTimeLagos, formatNaira } from "@/lib/orders/format";
import { riderPageCopy } from "@/lib/rider/page-copy";
import { getDeliveryHistory } from "@/lib/rider/queries";

// This page reads the session on every request. Block on the server so
// protected content is never served from the static shell or a cache.
export const instant = false;

export const metadata: Metadata = {
  title: "Delivery history · OjaLink rider",
  description: "Your finished OjaLink deliveries.",
};

export default async function RiderHistoryPage() {
  const user = await requireRole("rider");
  const history = await getDeliveryHistory(user.id);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8">
      <header>
        <p className="text-sm font-medium text-muted-foreground">{riderPageCopy.areaLabel}</p>
        <h1 className="font-heading text-[28px] leading-tight font-bold text-foreground">
          {riderPageCopy.historyTitle}
        </h1>
        <p className="mt-1 text-base text-muted-foreground">{riderPageCopy.historySubtitle}</p>
      </header>

      <RiderNav current="history" />

      <p className="text-base text-foreground">
        {riderPageCopy.historyCountLabel}:{" "}
        <span className="font-bold">{history.length}</span>
      </p>
      <p className="text-sm text-muted-foreground">{riderPageCopy.historyFeeNote}</p>

      {history.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-base text-foreground">{riderPageCopy.historyEmpty}</p>
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-4" aria-label={riderPageCopy.historyTitle}>
          {history.map((job) => (
            <li key={job.deliveryId}>
              <Card size="sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">{job.shopName}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-1 text-base">
                  <p className="text-foreground">
                    {riderPageCopy.deliverToLabel}: {job.deliveryArea}
                  </p>
                  <p className="text-foreground">
                    {riderPageCopy.deliveryFeeLabel}:{" "}
                    <span className="font-bold">{formatNaira(job.deliveryFeeKobo)}</span>
                  </p>
                  {job.deliveredAt ? (
                    <p className="text-sm text-muted-foreground">
                      {riderPageCopy.deliveredOn}{" "}
                      <time dateTime={job.deliveredAt.toISOString()}>
                        {formatDateTimeLagos(job.deliveredAt)}
                      </time>
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
