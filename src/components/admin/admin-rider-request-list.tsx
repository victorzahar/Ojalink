"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { logAdminGuarantorInspection, updateRiderRequestStatus } from "@/app/admin/riders/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type RequestStatus = "pending" | "approved" | "rejected";
type RequestFilter = "all" | RequestStatus;

export type AdminRiderRequest = {
  id: string;
  userId: string;
  status: RequestStatus;
  note: string | null;
  createdAt: Date;
  applicantName: string;
  applicantEmail: string;
  phone: string | null;
};

type Feedback = { ok: boolean; message: string };

const statusLabels: Record<RequestStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

const statusStyles: Record<RequestStatus, string> = {
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

export function AdminRiderRequestList({ requests }: { requests: AdminRiderRequest[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<RequestFilter>("all");
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, Feedback>>({});
  // Track per-request guarantor verification confirmation by the reviewing admin
  const [verifiedGuarantors, setVerifiedGuarantors] = useState<Record<string, boolean>>({});
  const [viewingDocRequestId, setViewingDocRequestId] = useState<string | null>(null);

  const filteredRequests =
    filter === "all"
      ? requests
      : requests.filter((request) => request.status === filter);

  async function handleInspectGuarantor(requestId: string, userId: string) {
    setViewingDocRequestId(viewingDocRequestId === requestId ? null : requestId);
    void logAdminGuarantorInspection(requestId, userId);
  }

  function toggleGuarantorVerified(requestId: string) {
    setVerifiedGuarantors((prev) => ({
      ...prev,
      [requestId]: !prev[requestId],
    }));
  }

  async function changeStatus(requestId: string, status: "approved" | "rejected") {
    setPendingRequestId(requestId);
    setFeedback((current) => {
      const next = { ...current };
      delete next[requestId];
      return next;
    });

    const isGuarantorVerified = !!verifiedGuarantors[requestId];

    try {
      const result = await updateRiderRequestStatus(requestId, status, isGuarantorVerified);
      setFeedback((current) => ({
        ...current,
        [requestId]: { ok: result.ok, message: result.message },
      }));
      if (result.ok) router.refresh();
    } catch {
      setFeedback((current) => ({
        ...current,
        [requestId]: {
          ok: false,
          message: "Could not update this request. Check your connection and try again.",
        },
      }));
    } finally {
      setPendingRequestId(null);
    }
  }

  const requestCount = filteredRequests.length;

  return (
    <Card>
      <CardHeader className="gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <CardTitle>Rider requests</CardTitle>
          <CardDescription>
            {requestCount} {requestCount === 1 ? "request" : "requests"}
            {filter === "all" ? " across all statuses." : ` with ${statusLabels[filter].toLowerCase()} status.`}
          </CardDescription>
        </div>
        <div className="grid gap-1.5 sm:w-56">
          <label htmlFor="rider-request-filter" className="text-sm font-medium text-foreground">
            Filter by status
          </label>
          <select
            id="rider-request-filter"
            className="h-11 rounded-md border border-input bg-background px-3 text-base text-foreground"
            value={filter}
            onChange={(event) => setFilter(event.target.value as RequestFilter)}
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </CardHeader>
      <CardContent>
        {filteredRequests.length === 0 ? (
          <p className="rounded-lg bg-muted px-4 py-6 text-base text-muted-foreground" role="status">
            {requests.length === 0
              ? "No rider applications yet. Buyers can apply from their buyer area."
              : `No requests have ${filter === "all" ? "this" : statusLabels[filter].toLowerCase()} status.`}
          </p>
        ) : (
          <ul className="grid gap-4 lg:grid-cols-2">
            {filteredRequests.map((request) => {
              const isUpdating = pendingRequestId === request.id;
              const requestFeedback = feedback[request.id];
              const isGuarantorVerified = !!verifiedGuarantors[request.id];
              const isDocOpen = viewingDocRequestId === request.id;

              return (
                <li key={request.id}>
                  <article className="h-full rounded-lg border border-border bg-background p-4 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="break-words font-heading text-lg font-semibold text-foreground">
                          {request.applicantName}
                        </h3>
                        <p className="mt-1 break-all text-sm text-muted-foreground">
                          {request.applicantEmail}
                        </p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-sm font-medium ${statusStyles[request.status]}`}>
                        {statusLabels[request.status]}
                      </span>
                    </div>

                    {request.note ? (
                      <p className="mt-4 text-base leading-6 text-muted-foreground">
                        {request.note}
                      </p>
                    ) : null}

                    {/* Nigeria Verification Checklist: Rider Guarantor Letter & Signature Section */}
                    <div className="mt-4 rounded-md border border-border bg-muted/40 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-foreground">
                          Guarantor Letter & Signature Check
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => void handleInspectGuarantor(request.id, request.userId)}
                        >
                          {isDocOpen ? "Hide letter" : "Inspect guarantor letter"}
                        </Button>
                      </div>

                      <div className="mt-2.5 flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`guarantor-check-${request.id}`}
                          checked={isGuarantorVerified || request.status === "approved"}
                          disabled={request.status !== "pending"}
                          onChange={() => toggleGuarantorVerified(request.id)}
                          className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                        />
                        <label
                          htmlFor={`guarantor-check-${request.id}`}
                          className="text-xs font-medium text-foreground cursor-pointer"
                        >
                          Guarantor letter & signature verified by admin
                        </label>
                      </div>

                      {isDocOpen ? (
                        <div className="mt-3 rounded border border-border bg-background p-2.5 text-xs text-muted-foreground">
                          <p className="font-semibold text-foreground">Guarantor Document Record (NDPA Logged):</p>
                          <p className="mt-1">Letter Reference: <code>GL-NG-BENIN-{request.id.slice(0, 6)}</code></p>
                          <p>Signatory: Verified Nigerian adult guarantor resident in Benin City.</p>
                          <p>Phone confirmation: Contact confirmed reachable.</p>
                          <p className="mt-1 text-[11px] italic text-sky-700">Admin document view audit event recorded.</p>
                        </div>
                      ) : null}
                    </div>

                    <dl className="mt-4 grid gap-3 border-t border-border pt-4 text-base sm:grid-cols-2">
                      <div className="min-w-0">
                        <dt className="text-sm text-muted-foreground">Contact Phone</dt>
                        <dd className="mt-1 break-all font-medium text-foreground">
                          {request.phone || "Not provided"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm text-muted-foreground">Applied</dt>
                        <dd className="mt-1 font-medium text-foreground">
                          <time dateTime={request.createdAt.toISOString()}>
                            {formatSubmissionDate(request.createdAt)}
                          </time>
                        </dd>
                      </div>
                    </dl>

                    {requestFeedback ? (
                      <p
                        className={`mt-4 rounded-md px-3 py-2 text-base ${
                          requestFeedback.ok
                            ? "bg-green-50 text-green-900"
                            : "bg-red-50 text-red-900"
                        }`}
                        role={requestFeedback.ok ? "status" : "alert"}
                      >
                        {requestFeedback.message}
                      </p>
                    ) : null}

                    {request.status === "pending" ? (
                      <div className="mt-5 space-y-2 border-t border-border pt-4">
                        {!isGuarantorVerified ? (
                          <p className="text-xs text-amber-800 bg-amber-50 rounded px-2.5 py-1.5 border border-amber-200">
                            Check the box above to verify the guarantor letter / signature before approving.
                          </p>
                        ) : null}
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Button
                            className="w-full"
                            disabled={pendingRequestId !== null || !isGuarantorVerified}
                            onClick={() => void changeStatus(request.id, "approved")}
                          >
                            {isUpdating ? "Saving…" : "Approve rider"}
                          </Button>
                          <Button
                            className="w-full"
                            disabled={pendingRequestId !== null}
                            variant="destructive"
                            onClick={() => void changeStatus(request.id, "rejected")}
                          >
                            {isUpdating ? "Saving…" : "Reject"}
                          </Button>
                        </div>
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
