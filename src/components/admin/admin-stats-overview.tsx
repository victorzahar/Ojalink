import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type StatusCount = { status: string; count: number };

export type AdminStatsSnapshot = {
  totalOrders: number;
  paidSalesKobo: number;
  totalVendors: number;
  openDisputes: number;
  ordersByStatus: StatusCount[];
  vendorsByStatus: StatusCount[];
};

function formatCount(value: number) {
  return new Intl.NumberFormat("en-NG").format(value);
}

function formatNaira(amountKobo: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(amountKobo / 100);
}

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

function StatusCounts({ title, entries }: { title: string; entries: StatusCount[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="divide-y divide-border">
          {entries.map(({ status, count }) => (
            <div className="flex items-center justify-between gap-4 py-3" key={status}>
              <dt className="capitalize text-foreground">{formatStatus(status)}</dt>
              <dd className="font-semibold tabular-nums text-foreground">
                {formatCount(count)}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

export function AdminStatsOverview({
  totalOrders,
  paidSalesKobo,
  totalVendors,
  openDisputes,
  ordersByStatus,
  vendorsByStatus,
}: AdminStatsSnapshot) {
  const noActivity = totalOrders === 0 && totalVendors === 0 && openDisputes === 0;

  return (
    <div className="flex flex-col gap-6">
      {noActivity ? (
        <p className="rounded-lg border border-border bg-card px-4 py-5 text-base text-muted-foreground" role="status">
          No OjaLink activity yet. Orders, vendors and disputes will appear here as people use the marketplace.
        </p>
      ) : null}

      <section aria-label="Platform totals" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>All orders</CardDescription>
            <CardTitle className="font-heading text-2xl">{formatCount(totalOrders)}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Orders recorded in OjaLink.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Paid sales</CardDescription>
            <CardTitle className="font-heading text-2xl">{formatNaira(paidSalesKobo)}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Successful payments, less refunds recorded on orders.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Vendors</CardDescription>
            <CardTitle className="font-heading text-2xl">{formatCount(totalVendors)}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Vendor accounts across all approval statuses.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Open disputes</CardDescription>
            <CardTitle className="font-heading text-2xl">{formatCount(openDisputes)}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Disputes waiting for admin review.
          </CardContent>
        </Card>
      </section>

      <section aria-label="Counts by status" className="grid gap-6 lg:grid-cols-2">
        <StatusCounts title="Orders by status" entries={ordersByStatus} />
        <StatusCounts title="Vendors by status" entries={vendorsByStatus} />
      </section>
    </div>
  );
}
