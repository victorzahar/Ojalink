"use client";

import { useState, type FormEvent } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { saveDisputeResolution } from "@/app/admin/disputes/[id]/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AdminPageShell } from "@/components/admin/admin-page-shell";

type DisputeStatus = "open" | "resolved" | "refunded";
type EditableDisputeStatus = "open" | "resolved";

export type AdminDisputeDetailRecord = {
  dispute: {
    id: string;
    status: DisputeStatus;
    reason: string;
    resolutionNote: string | null;
    createdAt: Date;
    raisedByName: string;
  };
  order: {
    id: string;
    status: string;
    subtotalKobo: number;
    deliveryFeeKobo: number;
    platformFeeKobo: number;
    totalKobo: number;
    refundKobo: number;
    refundedAt: Date | null;
  };
  items: Array<{
    id: string;
    productName: string;
    quantity: number;
    unitPriceKobo: number;
  }>;
  buyer: { name: string; email: string; phone: string | null };
  vendor: { shopName: string; ownerName: string };
  payment: {
    status: string;
    amountKobo: number;
    paidAt: Date | null;
  } | null;
};

type AdminDisputeDetailProps = { record: AdminDisputeDetailRecord };

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

export function AdminDisputeDetail({ record }: AdminDisputeDetailProps) {
  const router = useRouter();
  const [status, setStatus] = useState<EditableDisputeStatus>(
    record.dispute.status === "resolved" ? "resolved" : "open",
  );
  const [resolutionNote, setResolutionNote] = useState(
    record.dispute.resolutionNote ?? "",
  );
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const result = await saveDisputeResolution(
        record.dispute.id,
        status,
        resolutionNote,
      );
      setMessage({ ok: result.ok, text: result.message });
      if (result.ok) router.refresh();
    } catch {
      setMessage({
        ok: false,
        text: "Could not save this dispute. Check your connection and try again.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AdminPageShell
      title="Dispute details"
      description="Review the report, order and payment before recording a resolution."
      action={
        <Button asChild variant="outline">
          <Link href="/admin/disputes">Back to disputes</Link>
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Dispute</CardTitle>
            <CardDescription>
              Reported {formatDate(record.dispute.createdAt)}
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
                <dt className="text-sm text-muted-foreground">Status</dt>
                <dd className="mt-1 font-medium capitalize text-foreground">
                  {formatStatus(record.dispute.status)}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Raised by</dt>
                <dd className="mt-1 font-medium text-foreground">
                  {record.dispute.raisedByName}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm text-muted-foreground">Dispute ID</dt>
                <dd className="mt-1 break-all font-mono text-sm text-foreground">
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
              Order from {record.vendor.shopName} for {record.buyer.name}.
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
                <dt className="text-sm text-muted-foreground">Order ID</dt>
                <dd className="mt-1 break-all font-mono text-sm text-foreground">
                  {record.order.id}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Subtotal</dt>
                <dd className="mt-1 font-medium text-foreground">
                  {formatNaira(record.order.subtotalKobo)}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Delivery fee</dt>
                <dd className="mt-1 font-medium text-foreground">
                  {formatNaira(record.order.deliveryFeeKobo)}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Platform fee</dt>
                <dd className="mt-1 font-medium text-foreground">
                  {formatNaira(record.order.platformFeeKobo)}
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
                <dd className="mt-1 font-medium text-foreground">
                  {formatNaira(record.order.refundKobo)}
                </dd>
                {record.order.refundedAt ? (
                  <dd className="mt-1 text-sm text-muted-foreground">
                    {formatDate(record.order.refundedAt)}
                  </dd>
                ) : null}
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order items</CardTitle>
            <CardDescription>
              {record.items.length} {record.items.length === 1 ? "item" : "items"} on the order.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {record.items.length === 0 ? (
              <p className="text-base text-muted-foreground">No order items are recorded.</p>
            ) : (
              <ul className="divide-y divide-border">
                {record.items.map((item) => (
                  <li className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between" key={item.id}>
                    <div>
                      <p className="font-medium text-foreground">{item.productName}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} × {formatNaira(item.unitPriceKobo)}
                      </p>
                    </div>
                    <p className="font-medium text-foreground">
                      {formatNaira(item.quantity * item.unitPriceKobo)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Buyer and vendor</CardTitle>
            <CardDescription>People connected with this order.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <div>
              <h3 className="font-medium text-foreground">Buyer</h3>
              <p className="mt-2 break-words text-foreground">{record.buyer.name}</p>
              <p className="break-all text-sm text-muted-foreground">{record.buyer.email}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {record.buyer.phone || "No phone provided"}
              </p>
            </div>
            <div>
              <h3 className="font-medium text-foreground">Vendor</h3>
              <p className="mt-2 break-words text-foreground">{record.vendor.shopName}</p>
              <p className="text-sm text-muted-foreground">{record.vendor.ownerName}</p>
            </div>
            <div className="sm:col-span-2 border-t border-border pt-4">
              <h3 className="font-medium text-foreground">Payment</h3>
              {record.payment ? (
                <dl className="mt-2 grid gap-3 sm:grid-cols-3">
                  <div>
                    <dt className="text-sm text-muted-foreground">Status</dt>
                    <dd className="mt-1 font-medium capitalize text-foreground">
                      {formatStatus(record.payment.status)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Amount</dt>
                    <dd className="mt-1 font-medium text-foreground">
                      {formatNaira(record.payment.amountKobo)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Paid</dt>
                    <dd className="mt-1 font-medium text-foreground">
                      {record.payment.paidAt ? formatDate(record.payment.paidAt) : "Not recorded"}
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="mt-2 text-base text-muted-foreground">
                  No payment is recorded for this order.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resolution</CardTitle>
          <CardDescription>
            Record the outcome and a clear note for the team.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {record.dispute.status === "refunded" ? (
            <div className="space-y-3">
              <p className="rounded-lg bg-muted px-4 py-3 text-base text-muted-foreground" role="status">
                This dispute is refunded. Refund status is managed by the order refund workflow.
              </p>
              <p className="whitespace-pre-wrap text-foreground">
                {record.dispute.resolutionNote || "No resolution note recorded."}
              </p>
            </div>
          ) : (
            <form className="grid max-w-2xl gap-4" onSubmit={(event) => void handleSubmit(event)}>
              <div className="grid gap-1.5 sm:max-w-xs">
                <label htmlFor="dispute-resolution-status" className="text-sm font-medium text-foreground">
                  Dispute status
                </label>
                <select
                  id="dispute-resolution-status"
                  className="h-11 rounded-md border border-input bg-background px-3 text-base text-foreground"
                  value={status}
                  onChange={(event) => setStatus(event.target.value as EditableDisputeStatus)}
                >
                  <option value="open">Open</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="dispute-resolution-note" className="text-sm font-medium text-foreground">
                  Resolution note
                </label>
                <textarea
                  id="dispute-resolution-note"
                  className="min-h-32 rounded-md border border-input bg-background px-3 py-2 text-base text-foreground"
                  maxLength={2000}
                  value={resolutionNote}
                  onChange={(event) => setResolutionNote(event.target.value)}
                  placeholder="Describe what was decided and what was done."
                />
                <p className="text-sm text-muted-foreground">
                  {resolutionNote.length}/2000 characters. A note is required to resolve a dispute.
                </p>
              </div>
              {message ? (
                <p
                  className={`rounded-md px-3 py-2 text-base ${
                    message.ok ? "bg-green-50 text-green-900" : "bg-red-50 text-red-900"
                  }`}
                  role={message.ok ? "status" : "alert"}
                >
                  {message.text}
                </p>
              ) : null}
              <Button type="submit" className="w-full sm:w-fit" disabled={isSaving}>
                {isSaving ? "Saving…" : "Save resolution"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </AdminPageShell>
  );
}
