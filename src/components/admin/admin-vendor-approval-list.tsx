import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { markets, users, vendors } from "@/lib/db/schema";

type PendingVendor = {
  vendor: Pick<
    typeof vendors.$inferSelect,
    "id" | "shopName" | "description" | "createdAt"
  > & { approvalStatus: "pending" };
  owner: Pick<typeof users.$inferSelect, "name" | "email">;
  market: Pick<typeof markets.$inferSelect, "name" | "area">;
};

type AdminVendorApprovalListProps = {
  vendors: PendingVendor[];
};

function formatSubmissionDate(date: Date) {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeZone: "Africa/Lagos",
  }).format(date);
}

export function AdminVendorApprovalList({
  vendors: pendingVendors,
}: AdminVendorApprovalListProps) {
  const vendorLabel = pendingVendors.length === 1 ? "vendor" : "vendors";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vendor approvals</CardTitle>
        <CardDescription>
          {pendingVendors.length} {vendorLabel} waiting for review.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {pendingVendors.length === 0 ? (
          <p
            className="rounded-lg bg-muted px-4 py-6 text-sm text-muted-foreground"
            role="status"
          >
            No vendors are waiting for approval.
          </p>
        ) : (
          <ul className="grid gap-4 lg:grid-cols-2">
            {pendingVendors.map(({ vendor, owner, market }) => (
              <li key={vendor.id}>
                <article className="h-full rounded-lg border border-border bg-background p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="break-words font-heading text-lg font-semibold text-foreground">
                        {vendor.shopName}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {market.name} · {market.area}, Benin City
                      </p>
                    </div>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900">
                      Pending review
                    </span>
                  </div>

                  {vendor.description ? (
                    <p className="mt-4 text-sm leading-6 text-muted-foreground">
                      {vendor.description}
                    </p>
                  ) : null}

                  <dl className="mt-4 grid gap-3 border-t border-border pt-4 text-sm sm:grid-cols-2">
                    <div className="min-w-0">
                      <dt className="text-muted-foreground">Vendor contact</dt>
                      <dd className="mt-1 break-words font-medium text-foreground">
                        {owner.name}
                      </dd>
                      <dd className="break-all text-muted-foreground">
                        {owner.email}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Submitted</dt>
                      <dd className="mt-1 font-medium text-foreground">
                        <time dateTime={vendor.createdAt.toISOString()}>
                          {formatSubmissionDate(vendor.createdAt)}
                        </time>
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-5 border-t border-border pt-4">
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button className="w-full" disabled>
                        Approve
                      </Button>
                      <Button
                        className="w-full"
                        disabled
                        variant="destructive"
                      >
                        Reject
                      </Button>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                      Approval actions are unavailable until the protected
                      workflow is connected.
                    </p>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
