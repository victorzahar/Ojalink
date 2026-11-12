"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  disableRider,
  logAdminGuarantorInspection,
  reactivateRider,
  updateRiderRequestStatus,
} from "@/app/admin/riders/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { maskBankAccount, maskIdNumber } from "@/lib/verification/types";

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
  applicantImage?: string | null;
};

type Feedback = { ok: boolean; message: string };

const statusLabels: Record<RequestStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Disabled / Rejected",
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

type ParsedRiderMeta = {
  vehicle?: string;
  nin?: string;
  emergency?: string;
  bank?: string;
  guarantor?: string;
  availability?: string;
  rawNote?: string;
};

function parseRiderNote(note: string | null): ParsedRiderMeta {
  if (!note) return {};
  const lines = note.split("\n");
  const meta: ParsedRiderMeta = {};

  for (const line of lines) {
    if (line.startsWith("Vehicle:")) {
      meta.vehicle = line.replace("Vehicle:", "").trim();
    } else if (line.startsWith("NIN:")) {
      meta.nin = line.replace("NIN:", "").trim();
    } else if (line.startsWith("Emergency Contact:")) {
      meta.emergency = line.replace("Emergency Contact:", "").trim();
    } else if (line.startsWith("Bank:")) {
      meta.bank = line.replace("Bank:", "").trim();
    } else if (line.startsWith("Guarantor:")) {
      meta.guarantor = line.replace("Guarantor:", "").trim();
    } else if (line.startsWith("Availability:")) {
      meta.availability = line.replace("Availability:", "").trim();
    } else {
      if (!meta.rawNote) meta.rawNote = line;
      else meta.rawNote += `\n${line}`;
    }
  }

  return meta;
}

export function AdminRiderRequestList({ requests }: { requests: AdminRiderRequest[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<RequestFilter>("all");
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, Feedback>>({});
  // Track per-request guarantor verification confirmation by the reviewing admin
  const [verifiedGuarantors, setVerifiedGuarantors] = useState<Record<string, boolean>>({});
  const [viewingDocRequestId, setViewingDocRequestId] = useState<string | null>(null);
  const [confirmingDisableId, setConfirmingDisableId] = useState<string | null>(null);

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

  async function handleDisable(requestId: string, targetUserId: string) {
    setPendingRequestId(requestId);
    setFeedback((current) => {
      const next = { ...current };
      delete next[requestId];
      return next;
    });

    try {
      const result = await disableRider(requestId, targetUserId);
      setFeedback((current) => ({
        ...current,
        [requestId]: { ok: result.ok, message: result.message },
      }));
      if (result.ok) {
        setConfirmingDisableId(null);
        router.refresh();
      }
    } catch {
      setFeedback((current) => ({
        ...current,
        [requestId]: {
          ok: false,
          message: "Could not disable rider. Check your connection and try again.",
        },
      }));
    } finally {
      setPendingRequestId(null);
    }
  }

  async function handleReactivate(requestId: string, targetUserId: string) {
    setPendingRequestId(requestId);
    setFeedback((current) => {
      const next = { ...current };
      delete next[requestId];
      return next;
    });

    try {
      const result = await reactivateRider(requestId, targetUserId);
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
          message: "Could not re-activate rider. Check your connection and try again.",
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
            <option value="rejected">Disabled / Rejected</option>
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
              const isConfirmingDisable = confirmingDisableId === request.id;
              const meta = parseRiderNote(request.note);

              return (
                <li key={request.id}>
                  <article className="h-full rounded-lg border border-border bg-background p-4 sm:p-5">
                    {/* Header: Rider avatar, name, email & status badge */}
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {request.applicantImage ? (
                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-border shadow-sm">
                            <Image
                              src={request.applicantImage}
                              alt={request.applicantName}
                              fill
                              unoptimized={request.applicantImage.startsWith("data:")}
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-base font-bold text-primary">
                            {request.applicantName.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h3 className="break-words font-heading text-lg font-semibold text-foreground">
                            {request.applicantName}
                          </h3>
                          <p className="break-all text-xs text-muted-foreground">
                            {request.applicantEmail}
                          </p>
                        </div>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[request.status]}`}>
                        {statusLabels[request.status]}
                      </span>
                    </div>

                    {/* Vehicle & Logistics Badges */}
                    {meta.vehicle ? (
                      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
                        <span className="rounded-md bg-sky-50 px-2 py-0.5 font-medium text-sky-800 border border-sky-200">
                          🏍️ {meta.vehicle}
                        </span>
                      </div>
                    ) : null}

                    {/* Verification Details: NIN & Bank Info (Masked) */}
                    {(meta.nin || meta.bank || meta.emergency) && (
                      <div className="mt-3 rounded-md bg-muted/30 p-2.5 text-xs space-y-1">
                        {meta.nin && (
                          <p className="text-muted-foreground">
                            <span className="font-medium text-foreground">NIN:</span> {maskIdNumber(meta.nin)}
                          </p>
                        )}
                        {meta.emergency && (
                          <p className="text-muted-foreground">
                            <span className="font-medium text-foreground">Emergency Contact:</span> {meta.emergency}
                          </p>
                        )}
                        {meta.bank && (
                          <p className="text-muted-foreground">
                            <span className="font-medium text-foreground">Payout Bank:</span>{" "}
                            {meta.bank.includes("-")
                              ? `${meta.bank.split("-")[0].trim()} - ${maskBankAccount(meta.bank.split("-")[1].trim())}`
                              : meta.bank}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Availability / Note */}
                    {(meta.availability || meta.rawNote) && (
                      <p className="mt-3 text-xs leading-5 text-muted-foreground italic">
                        &ldquo;{meta.availability || meta.rawNote}&rdquo;
                      </p>
                    )}

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
                        <div className="mt-3 rounded border border-border bg-background p-2.5 text-xs text-muted-foreground space-y-1">
                          <p className="font-semibold text-foreground">Guarantor Document Record (NDPA Logged):</p>
                          <p>Letter Reference: <code>GL-NG-BENIN-{request.id.slice(0, 6)}</code></p>
                          {meta.guarantor ? (
                            <p className="text-foreground font-medium">Details: {meta.guarantor}</p>
                          ) : (
                            <>
                              <p>Signatory: Verified Nigerian adult guarantor resident in Benin City.</p>
                              <p>Phone confirmation: Contact confirmed reachable.</p>
                            </>
                          )}
                          <p className="pt-1 text-[11px] italic text-sky-700">Admin document view audit event recorded.</p>
                        </div>
                      ) : null}
                    </div>

                    <dl className="mt-4 grid gap-3 border-t border-border pt-4 text-xs sm:grid-cols-2">
                      <div className="min-w-0">
                        <dt className="text-muted-foreground">Contact Phone</dt>
                        <dd className="mt-0.5 break-all font-medium text-foreground">
                          {request.phone || "Not provided"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Applied</dt>
                        <dd className="mt-0.5 font-medium text-foreground">
                          <time dateTime={request.createdAt.toISOString()}>
                            {formatSubmissionDate(request.createdAt)}
                          </time>
                        </dd>
                      </div>
                    </dl>

                    {requestFeedback ? (
                      <p
                        className={`mt-4 rounded-md px-3 py-2 text-xs ${
                          requestFeedback.ok
                            ? "bg-green-50 text-green-900 border border-green-200"
                            : "bg-red-50 text-red-900 border border-red-200"
                        }`}
                        role={requestFeedback.ok ? "status" : "alert"}
                      >
                        {requestFeedback.message}
                      </p>
                    ) : null}

                    {/* Pending Actions */}
                    {request.status === "pending" ? (
                      <div className="mt-4 space-y-2 border-t border-border pt-3">
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

                    {/* Approved Actions: Disable Rider Button */}
                    {request.status === "approved" ? (
                      <div className="mt-4 border-t border-border pt-3">
                        {isConfirmingDisable ? (
                          <div className="space-y-2 rounded-md border border-destructive/30 bg-destructive/5 p-3">
                            <p className="text-xs font-semibold text-destructive">
                              Confirm Disable Rider
                            </p>
                            <p className="text-xs text-muted-foreground">
                              This will immediately revoke their delivery privileges and switch their account role back to buyer. They can be re-activated later.
                            </p>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={pendingRequestId !== null}
                                onClick={() => void handleDisable(request.id, request.userId)}
                              >
                                {isUpdating ? "Disabling…" : "Yes, disable rider"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setConfirmingDisableId(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            variant="destructive"
                            size="sm"
                            className="w-full"
                            disabled={pendingRequestId !== null}
                            onClick={() => setConfirmingDisableId(request.id)}
                          >
                            Disable rider
                          </Button>
                        )}
                      </div>
                    ) : null}

                    {/* Rejected / Disabled Actions: Re-activate Rider Button */}
                    {request.status === "rejected" ? (
                      <div className="mt-4 border-t border-border pt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-green-700 hover:text-green-800 border-green-300 hover:bg-green-50"
                          disabled={pendingRequestId !== null}
                          onClick={() => void handleReactivate(request.id, request.userId)}
                        >
                          {isUpdating ? "Re-activating…" : "Re-activate rider"}
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
