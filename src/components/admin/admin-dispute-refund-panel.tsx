import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AdminPageShell } from "@/components/admin/admin-page-shell";

/** UI-only data projection; refund fields are expected from PR #6, not this branch's schema. */
export type AdminDisputeRefundView = {
  dispute: {
    id: string;
    reason: string;
    status: string;
    createdAt: Date;
  };
  order: {
    id: string;
    status: string;
    totalKobo: number;
    refundKobo: number;
    refundedAt: Date | null;
  };
  payment: {
    status: string;
  };
  buyer: {
    name: string;
    email: string;
  };
  vendor: {
    shopName: string;
  };
};

type AdminDisputeRefundPanelProps = {
  record: AdminDisputeRefundView;
};

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

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeZone: "Africa/Lagos",
  }).format(date);
}

export function AdminDisputeRefundPanel({
  record,
}: AdminDisputeRefundPanelProps) {
  const remainingRefundKobo = Math.max(
    0,
    record.order.totalKobo - record.order.refundKobo,
  );

  return (
    <AdminPageShell
      title="Dispute details"
      description="Review the buyer’s report, order and refund record."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Dispute</CardTitle>
            <CardDescription>
              Opened {formatDate(record.dispute.createdAt)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Reason</p>
              <p className="mt-1 whitespace-pre-wrap text-foreground">
                {record.dispute.reason}
              </p>
            </div>
            <dl className="grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-muted-foreground">Dispute status</dt>
                <dd className="mt-1 font-medium capitalize text-foreground">
                  {formatStatus(record.dispute.status)}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Dispute ID</dt>
                <dd className="mt-1 break-all font-mono text-xs text-foreground">
                  {record.dispute.id}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order</CardTitle>
            <CardDescription>
              Order for {record.buyer.name} from {record.vendor.shopName}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-muted-foreground">Order status</dt>
                <dd className="mt-1 font-medium capitalize text-foreground">
                  {formatStatus(record.order.status)}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Payment status</dt>
                <dd className="mt-1 font-medium capitalize text-foreground">
                  {formatStatus(record.payment.status)}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Order total</dt>
                <dd className="mt-1 font-heading text-lg font-semibold text-foreground">
                  {formatNaira(record.order.totalKobo)}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Refund recorded</dt>
                <dd className="mt-1 font-heading text-lg font-semibold text-foreground">
                  {formatNaira(record.order.refundKobo)}
                </dd>
                {record.order.refundedAt ? (
                  <dd className="mt-1 text-sm text-muted-foreground">
                    {formatDate(record.order.refundedAt)}
                  </dd>
                ) : null}
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm text-muted-foreground">Buyer contact</dt>
                <dd className="mt-1 break-all text-foreground">
                  {record.buyer.email}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm text-muted-foreground">Order ID</dt>
                <dd className="mt-1 break-all font-mono text-xs text-foreground">
                  {record.order.id}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Refund amount</CardTitle>
          <CardDescription>
            Available refund amount: {formatNaira(remainingRefundKobo)}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-lg bg-accent px-4 py-4 text-accent-foreground">
            <p className="font-medium">How a refund changes the order</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
              <li>A partial refund leaves the order delivered.</li>
              <li>A full refund marks the order, payment and dispute refunded.</li>
            </ul>
          </div>

          <div className="max-w-md space-y-2">
            <label
              className="text-sm font-medium text-foreground"
              htmlFor="refund-amount-naira"
            >
              Amount to refund (₦)
            </label>
            <Input
              id="refund-amount-naira"
              type="number"
              min="0.01"
              max={(remainingRefundKobo / 100).toFixed(2)}
              step="0.01"
              inputMode="decimal"
              placeholder="For example, 2500.00"
              disabled
              aria-describedby="refund-action-note"
            />
          </div>

          <p
            className="text-sm text-muted-foreground"
            id="refund-action-note"
            role="status"
          >
            Refund actions will be available after the approved order refund
            migration is on main.
          </p>
        </CardContent>
      </Card>
    </AdminPageShell>
  );
}
