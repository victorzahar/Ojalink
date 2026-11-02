import { JobActionButton } from "@/components/rider/job-action-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNaira } from "@/lib/orders/format";
import { riderPageCopy } from "@/lib/rider/page-copy";
import type { ActiveJob, AvailableJob } from "@/lib/rider/queries";

export function AvailableJobCard({ job }: { job: AvailableJob }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{job.shopName}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <dl className="flex flex-col gap-3 text-base">
          <div>
            <dt className="text-sm text-muted-foreground">{riderPageCopy.pickupLabel}</dt>
            <dd className="font-medium text-foreground">
              {job.marketName}, {job.marketArea}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">{riderPageCopy.deliverToLabel}</dt>
            <dd className="font-medium text-foreground">{job.deliveryArea}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">{riderPageCopy.deliveryFeeLabel}</dt>
            <dd className="text-lg font-bold text-foreground">
              {formatNaira(job.deliveryFeeKobo)}
            </dd>
          </div>
        </dl>
        <JobActionButton
          deliveryId={job.deliveryId}
          action="accept"
          label={riderPageCopy.acceptButton}
        />
      </CardContent>
    </Card>
  );
}

export function ActiveJobCard({ job }: { job: ActiveJob }) {
  const isPickedUp = job.status === "picked_up";
  // Keep only digits and "+" so the tel: link is always a clean number.
  const dialNumber = job.buyerPhone?.replace(/[^\d+]/g, "") ?? "";

  return (
    <Card>
      <CardHeader className="gap-2">
        <CardTitle className="text-lg font-semibold">{job.shopName}</CardTitle>
        <p className="w-fit rounded-full bg-accent/20 px-3 py-1 text-sm font-semibold text-foreground">
          {isPickedUp ? riderPageCopy.statusPickedUp : riderPageCopy.statusAccepted}
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <dl className="flex flex-col gap-3 text-base">
          <div>
            <dt className="text-sm text-muted-foreground">{riderPageCopy.pickupLabel}</dt>
            <dd className="font-medium text-foreground">
              {job.marketName}, {job.marketArea}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">{riderPageCopy.itemsLabel}</dt>
            <dd className="text-foreground">{job.itemsSummary}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">{riderPageCopy.deliverToLabel}</dt>
            <dd className="font-medium text-foreground">
              {job.deliveryAddress}, {job.deliveryArea}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">{riderPageCopy.buyerLabel}</dt>
            <dd className="text-foreground">{job.buyerName}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">{riderPageCopy.deliveryFeeLabel}</dt>
            <dd className="text-lg font-bold text-foreground">
              {formatNaira(job.deliveryFeeKobo)}
            </dd>
          </div>
        </dl>

        {dialNumber ? (
          <a
            href={`tel:${dialNumber}`}
            className="inline-flex h-12 w-full items-center justify-center rounded-md border border-primary bg-background px-4 text-base font-medium text-primary"
          >
            {riderPageCopy.callBuyer}: {job.buyerPhone}
          </a>
        ) : (
          <p className="text-base text-muted-foreground">{riderPageCopy.noPhone}</p>
        )}

        <JobActionButton
          deliveryId={job.deliveryId}
          action={isPickedUp ? "delivered" : "picked_up"}
          label={isPickedUp ? riderPageCopy.deliveredButton : riderPageCopy.pickedUpButton}
        />
      </CardContent>
    </Card>
  );
}
