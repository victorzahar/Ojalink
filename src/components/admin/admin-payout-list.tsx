import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type AdminPayout = {
  id: string;
  vendorName: string;
  weekStart: string;
  amountKobo: number;
  status: "unpaid" | "paid";
  paidAt: Date | null;
};

function formatNaira(amountKobo: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(amountKobo / 100);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeZone: "Africa/Lagos",
  }).format(date);
}

export function AdminPayoutList({
  payouts,
  pendingTotalKobo,
}: {
  payouts: AdminPayout[];
  pendingTotalKobo: number;
}) {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardDescription>Pending payouts</CardDescription>
          <CardTitle className="font-heading text-2xl">
            {formatNaira(pendingTotalKobo)}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Total amount recorded for unpaid vendor weeks.
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Weekly payouts</CardTitle>
          <CardDescription>
            {payouts.length} {payouts.length === 1 ? "payout" : "payouts"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <p
              className="rounded-lg bg-muted px-4 py-6 text-base text-muted-foreground"
              role="status"
            >
              No vendor payouts have been recorded yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[40rem] text-left text-sm">
                <thead className="border-b border-border text-muted-foreground">
                  <tr>
                    <th className="px-3 py-3 font-medium" scope="col">
                      Vendor
                    </th>
                    <th className="px-3 py-3 font-medium" scope="col">
                      Week starting
                    </th>
                    <th className="px-3 py-3 text-right font-medium" scope="col">
                      Amount
                    </th>
                    <th className="px-3 py-3 font-medium" scope="col">
                      Status
                    </th>
                    <th className="px-3 py-3 font-medium" scope="col">
                      Paid on
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {payouts.map((payout) => (
                    <tr key={payout.id}>
                      <th
                        className="px-3 py-4 font-medium text-foreground"
                        scope="row"
                      >
                        {payout.vendorName}
                      </th>
                      <td className="px-3 py-4 text-muted-foreground">
                        <time dateTime={payout.weekStart}>{payout.weekStart}</time>
                      </td>
                      <td className="px-3 py-4 text-right font-semibold tabular-nums text-foreground">
                        {formatNaira(payout.amountKobo)}
                      </td>
                      <td className="px-3 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
                            payout.status === "paid"
                              ? "bg-green-100 text-green-900"
                              : "bg-amber-100 text-amber-900"
                          }`}
                        >
                          {payout.status === "paid" ? "Paid" : "Unpaid"}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-muted-foreground">
                        {payout.paidAt ? (
                          <time dateTime={payout.paidAt.toISOString()}>
                            {formatDate(payout.paidAt)}
                          </time>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
