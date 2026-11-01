"use client";

import { useState } from "react";

import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type DisputeStatus = "open" | "resolved" | "refunded";
type StatusFilter = "all" | DisputeStatus;

type DisputeSummary = {
  id: string;
  orderId: string;
  reason: string;
  status: DisputeStatus;
  raisedBy: string;
  createdAt: Date;
};

const statusLabels: Record<DisputeStatus, string> = {
  open: "Open",
  resolved: "Resolved",
  refunded: "Refunded",
};

const statusStyles: Record<DisputeStatus, string> = {
  open: "bg-amber-100 text-amber-900",
  resolved: "bg-green-100 text-green-900",
  refunded: "bg-blue-100 text-blue-900",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeZone: "Africa/Lagos",
  }).format(date);
}

export function AdminDisputeList({ disputes }: { disputes: DisputeSummary[] }) {
  const [filter, setFilter] = useState<StatusFilter>("all");
  const filteredDisputes =
    filter === "all"
      ? disputes
      : disputes.filter((dispute) => dispute.status === filter);
  const countLabel = filteredDisputes.length === 1 ? "dispute" : "disputes";

  return (
    <Card>
      <CardHeader className="gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <CardTitle>Dispute reports</CardTitle>
          <CardDescription>
            {filteredDisputes.length} {countLabel}
            {filter === "all" ? " across all statuses." : ` with ${statusLabels[filter].toLowerCase()} status.`}
          </CardDescription>
        </div>
        <div className="grid gap-1.5 sm:w-56">
          <label htmlFor="dispute-status-filter" className="text-sm font-medium text-foreground">
            Filter by status
          </label>
          <select
            id="dispute-status-filter"
            className="h-11 rounded-md border border-input bg-background px-3 text-base text-foreground"
            value={filter}
            onChange={(event) => setFilter(event.target.value as StatusFilter)}
          >
            <option value="all">All statuses</option>
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </CardHeader>
      <CardContent>
        {filteredDisputes.length === 0 ? (
          <p className="rounded-lg bg-muted px-4 py-6 text-base text-muted-foreground" role="status">
            {disputes.length === 0
              ? "No disputes have been reported yet."
              : `No disputes have ${statusLabels[filter as DisputeStatus].toLowerCase()} status.`}
          </p>
        ) : (
          <ul className="grid gap-3">
            {filteredDisputes.map((dispute) => (
              <li key={dispute.id}>
                <Link
                  href={`/admin/disputes/${dispute.id}`}
                  className="block rounded-lg border border-border bg-background p-4 transition-colors hover:bg-muted focus-visible:outline sm:p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-muted-foreground">
                        Order {dispute.orderId}
                      </p>
                      <h2 className="mt-1 break-words font-heading text-lg font-semibold text-foreground">
                        {dispute.reason}
                      </h2>
                    </div>
                    <span className={`w-fit rounded-full px-3 py-1 text-sm font-medium ${statusStyles[dispute.status]}`}>
                      {statusLabels[dispute.status]}
                    </span>
                  </div>
                  <dl className="mt-4 grid gap-3 border-t border-border pt-3 text-base sm:grid-cols-2">
                    <div>
                      <dt className="text-sm text-muted-foreground">Raised by</dt>
                      <dd className="mt-1 font-medium text-foreground">{dispute.raisedBy}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Reported</dt>
                      <dd className="mt-1 font-medium text-foreground">
                        <time dateTime={dispute.createdAt.toISOString()}>
                          {formatDate(dispute.createdAt)}
                        </time>
                      </dd>
                    </div>
                  </dl>
                  <span className="mt-4 inline-block text-sm font-medium text-primary">
                    Review dispute
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
