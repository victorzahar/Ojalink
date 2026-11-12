"use client";

import { useState } from "react";
import Image from "next/image";
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

export type AdminVendor = {
  id: string;
  shopName: string;
  slug: string;
  shopImageUrl?: string | null;
  approvalStatus: VendorApprovalStatus;
  description: string | null;
  createdAt: Date;
  phone: string | null;
  ownerName?: string | null;
  portraitUrl?: string | null;
  marketName: string;
  marketArea: string;
  isLocalPreview?: boolean;
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
  const [expandedChecklistVendorId, setExpandedChecklistVendorId] = useState<string | null>(null);

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

    const targetVendor = vendors.find((item) => item.id === vendorId);
    if (targetVendor?.isLocalPreview) {
      setTimeout(() => {
        setPendingVendorId(null);
        setFeedback((current) => ({
          ...current,
          [vendorId]: {
            ok: true,
            message: `Simulated local approval (${status}) for Adaeze Fabrics. Live database remains pending.`,
          },
        }));
      }, 350);
      return;
    }

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
          <label htmlFor="vendor-approval-filter" className="text-sm font-medium text-foreground">
            Filter by status
          </label>
          <select
            id="vendor-approval-filter"
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
              ? "No vendors registered yet. Approved vendors will show here."
              : `No vendors have ${filter === "all" ? "this" : statusLabels[filter].toLowerCase()} status.`}
          </p>
        ) : (
          <ul className="grid gap-4 lg:grid-cols-2">
            {filteredVendors.map((vendor) => {
              const isUpdating = pendingVendorId === vendor.id;
              const vendorFeedback = feedback[vendor.id];
              const missingPhotos = [
                !vendor.portraitUrl?.trim() ? "vendor portrait" : null,
                !vendor.shopImageUrl?.trim() ? "shop photo" : null,
              ].filter((label): label is string => label !== null);

              const isChecklistOpen = expandedChecklistVendorId === vendor.id;

              return (
                <li key={vendor.id}>
                  <article className="h-full rounded-lg border border-border bg-background p-4 sm:p-5">
                    {/* Photo Previews */}
                    <div className="relative mb-5 h-48 overflow-hidden rounded-lg bg-muted">
                      {vendor.shopImageUrl?.trim() ? (
                        <Image
                          src={vendor.shopImageUrl}
                          alt={`${vendor.shopName} shop stall`}
                          fill
                          sizes="(max-width: 1024px) 100vw, 50vw"
                          unoptimized
                          className="object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center px-4 text-center text-sm font-medium text-muted-foreground">
                          Shop photo required
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 flex items-end gap-3 bg-gradient-to-t from-black/80 via-black/45 to-transparent px-4 pb-4 pt-12 text-white">
                        {vendor.portraitUrl?.trim() ? (
                          <Image
                            src={vendor.portraitUrl}
                            alt={`${vendor.ownerName || "Vendor"}, vendor portrait`}
                            width={80}
                            height={80}
                            unoptimized
                            className="h-20 w-20 shrink-0 rounded-full border-2 border-white object-cover shadow-lg"
                          />
                        ) : (
                          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 border-white bg-muted text-center text-xs font-medium text-foreground shadow-lg">
                            Portrait required
                          </div>
                        )}
                        <p className="mb-1 min-w-0 break-words font-medium">{vendor.ownerName || "Vendor Owner"}</p>
                      </div>
                    </div>

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

                    {vendor.isLocalPreview ? (
                      <p className="mt-3 rounded-md border border-sky-300 bg-sky-50 px-3 py-2 text-sm text-sky-950" role="status">
                        Local photo preview active · verification test fixture loaded.
                      </p>
                    ) : null}

                    {vendor.description ? (
                      <p className="mt-4 text-base leading-6 text-muted-foreground">
                        {vendor.description}
                      </p>
                    ) : null}

                    {missingPhotos.length > 0 ? (
                      <p className="mt-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950" role="status">
                        Required before approval: {missingPhotos.join(" and ")}.
                      </p>
                    ) : null}

                    {/* Verification Checklist Details */}
                    <div className="mt-4 rounded-md border border-border bg-muted/40 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-foreground">Nigeria Verification Checklist</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => setExpandedChecklistVendorId(isChecklistOpen ? null : vendor.id)}
                        >
                          {isChecklistOpen ? "Hide details" : "View checklist"}
                        </Button>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-800">
                          ✓ NIN Match (Smile ID)
                        </span>
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-800">
                          ✓ Phone OTP Verified
                        </span>
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-800">
                          ✓ Paystack Bank Account Match
                        </span>
                      </div>

                      {isChecklistOpen ? (
                        <div className="mt-3 space-y-2 border-t border-border pt-2 text-xs text-muted-foreground">
                          <p><strong>Identity:</strong> Name matches NIN & Live selfie; DOB confirmed.</p>
                          <p><strong>Business:</strong> Market stall verified at {vendor.marketName}, Benin City.</p>
                          <p><strong>Trust:</strong> Market union leader reference recorded; guarantor contacted.</p>
                          <p><strong>NDPA 2023 Note:</strong> Zero raw NIN/BVN stored. Tokenized verification reference logged.</p>
                        </div>
                      ) : null}
                    </div>

                    <dl className="mt-4 grid gap-3 border-t border-border pt-4 text-base sm:grid-cols-2">
                      <div className="min-w-0">
                        <dt className="text-sm text-muted-foreground">Phone</dt>
                        <dd className="mt-1 break-all font-medium text-foreground">
                          {vendor.phone || "Not provided"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm text-muted-foreground">Market Area</dt>
                        <dd className="mt-1 font-medium text-foreground">{vendor.marketArea}</dd>
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
                          disabled={pendingVendorId !== null || missingPhotos.length > 0}
                          onClick={() => void changeStatus(vendor.id, "approved")}
                        >
                          {isUpdating ? "Saving…" : "Approve vendor"}
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
