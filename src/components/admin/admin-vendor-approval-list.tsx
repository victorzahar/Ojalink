"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { updateVendorApprovalStatus } from "@/app/admin/vendors/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type VendorApprovalStatus = "pending" | "approved" | "rejected";
type VendorStatusFilter = "all" | VendorApprovalStatus;

type AdminVendor = {
  id: string;
  shopName: string;
  approvalStatus: VendorApprovalStatus;
  description: string | null;
  createdAt: Date;
  phone: string | null;
  marketName: string;
  marketArea: string;
};

type Feedback = { ok: boolean; message: string };

const statusLabels: Record<VendorApprovalStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

const statusStyles: Record<VendorApprovalStatus, string> = {
  pending: "bg-amber-100 text-amber-900",
  approved: "bg-green-100 text-green-900",
  rejected: "bg-red-100 text-red-900",
};

function formatSubmissionDate(date: Date) {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeZone: "Africa/Lagos",
  }).format(date);
}

export function AdminVendorApprovalList({ vendors }: { vendors: AdminVendor[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<VendorStatusFilter>("all");
  const [pendingVendorId, setPendingVendorId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, Feedback>>({});

  const filteredVendors =
    filter === "all"
      ? vendors
      : vendors.filter((vendor) => vendor.approvalStatus === filter);

  async function changeStatus(vendorId: string, status: "approved" | "rejected") {
    setPendingVendorId(vendorId);
    setFeedback((current) => {
      const next = { ...current };
      delete next[vendorId];
      return next;
    });

    try {
      const result = await updateVendorApprovalStatus(vendorId, status);
      setFeedback((current) => ({
        ...current,
        [vendorId]: { ok: result.ok, message: result.message },
      }));
      if (result.ok) router.refresh();
    } catch {
      setFeedback((current) => ({
        ...current,
        [vendorId]: {
          ok: false,
          message: "Could not update this vendor. Check your connection and try again.",
        },
      }));
    } finally {
      setPendingVendorId(null);
    }
  }

  const vendorCount = filteredVendors.length;

  return (
    <Card>
      <CardHeader className="gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <CardTitle>Vendors</CardTitle>
          <CardDescription>
            {vendorCount} {vendorCount === 1 ? "vendor" : "vendors"}
            {filter === "all" ? " across all statuses." : ` with ${statusLabels[filter].toLowerCase()} status.`}
          </CardDescription>
        </div>
        <div className="grid gap-1.5 sm:w-56">
          <label htmlFor="vendor-status-filter" className="text-sm font-medium text-foreground">
            Filter by status
          </label>
          <select
            id="vendor-status-filter"
            className="h-11 rounded-md border border-input bg-background px-3 text-base text-foreground"
            value={filter}
            onChange={(event) => setFilter(event.target.value as VendorStatusFilter)}
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </CardHeader>
      <CardContent>
        {filteredVendors.length === 0 ? (
          <p className="rounded-lg bg-muted px-4 py-6 text-base text-muted-foreground" role="status">
            {vendors.length === 0
              ? "No vendors have registered yet."
              : `No vendors have ${filter === "all" ? "this" : statusLabels[filter].toLowerCase()} status.`}
          </p>
        ) : (
          <ul className="grid gap-4 lg:grid-cols-2">
            {filteredVendors.map((vendor) => {
              const isUpdating = pendingVendorId === vendor.id;
              const vendorFeedback = feedback[vendor.id];

              return (
                <li key={vendor.id}>
                  <article className="h-full rounded-lg border border-border bg-background p-4 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="break-words font-heading text-lg font-semibold text-foreground">
                          {vendor.shopName}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {vendor.marketName} · {vendor.marketArea}, Benin City
                        </p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-sm font-medium ${statusStyles[vendor.approvalStatus]}`}>
                        {statusLabels[vendor.approvalStatus]}
                      </span>
                    </div>

                    {vendor.description ? (
                      <p className="mt-4 text-base leading-6 text-muted-foreground">
                        {vendor.description}
                      </p>
                    ) : null}

                    <dl className="mt-4 grid gap-3 border-t border-border pt-4 text-base sm:grid-cols-2">
                      <div className="min-w-0">
                        <dt className="text-sm text-muted-foreground">Phone</dt>
                        <dd className="mt-1 break-all font-medium text-foreground">
                          {vendor.phone || "Not provided"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm text-muted-foreground">Stall location</dt>
                        <dd className="mt-1 font-medium text-foreground">Not recorded</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-muted-foreground">Registered</dt>
                        <dd className="mt-1 font-medium text-foreground">
                          <time dateTime={vendor.createdAt.toISOString()}>
                            {formatSubmissionDate(vendor.createdAt)}
                          </time>
                        </dd>
                      </div>
                    </dl>

                    {vendorFeedback ? (
                      <p
                        className={`mt-4 rounded-md px-3 py-2 text-base ${
                          vendorFeedback.ok
                            ? "bg-green-50 text-green-900"
                            : "bg-red-50 text-red-900"
                        }`}
                        role={vendorFeedback.ok ? "status" : "alert"}
                      >
                        {vendorFeedback.message}
                      </p>
                    ) : null}

                    {vendor.approvalStatus === "pending" ? (
                      <div className="mt-5 flex flex-col gap-2 border-t border-border pt-4 sm:flex-row">
                        <Button
                          className="w-full"
                          disabled={pendingVendorId !== null}
                          onClick={() => void changeStatus(vendor.id, "approved")}
                        >
                          {isUpdating ? "Saving…" : "Approve"}
                        </Button>
                        <Button
                          className="w-full"
                          disabled={pendingVendorId !== null}
                          variant="destructive"
                          onClick={() => void changeStatus(vendor.id, "rejected")}
                        >
                          {isUpdating ? "Saving…" : "Reject"}
                        </Button>
                      </div>
                    ) : null}
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
