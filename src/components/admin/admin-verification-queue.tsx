"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { reviewVerification } from "@/app/admin/verifications/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type VerificationStatus = "pending" | "verified" | "failed";
type VerificationKind =
  | "phone_otp"
  | "nin"
  | "id_document"
  | "selfie"
  | "cac"
  | "tin"
  | "bank_account"
  | "driver_licence"
  | "vehicle"
  | "shop_evidence";

type AdminVerification = {
  id: string;
  kind: VerificationKind;
  status: VerificationStatus;
  provider: string;
  providerRef: string | null;
  note: string | null;
  attempts: number;
  createdAt: Date;
  reviewedAt: Date | null;
  applicantName: string;
  applicantEmail: string;
};

const kindLabels: Record<VerificationKind, string> = {
  phone_otp: "Phone OTP",
  nin: "NIN (identity)",
  id_document: "ID document",
  selfie: "Selfie match",
  cac: "CAC number",
  tin: "TIN",
  bank_account: "Bank account",
  driver_licence: "Driver licence",
  vehicle: "Vehicle",
  shop_evidence: "Shop evidence",
};

const statusLabels: Record<VerificationStatus, string> = {
  pending: "Pending",
  verified: "Verified",
  failed: "Failed",
};

const statusStyles: Record<VerificationStatus, string> = {
  pending: "bg-amber-100 text-amber-900",
  verified: "bg-green-100 text-green-900",
  failed: "bg-red-100 text-red-900",
};

const inputClassName =
  "h-11 rounded-md border border-input bg-background px-3 text-base text-foreground";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeZone: "Africa/Lagos",
  }).format(date);
}

function shortRef(providerRef: string | null) {
  if (!providerRef) return "—";
  return providerRef.length > 14 ? `${providerRef.slice(0, 14)}…` : providerRef;
}

export function AdminVerificationQueue({
  verifications,
}: {
  verifications: AdminVerification[];
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, { ok: boolean; message: string }>>({});

  async function decide(verificationId: string, status: "verified" | "failed") {
    setPendingId(verificationId);
    setFeedback((current) => {
      const next = { ...current };
      delete next[verificationId];
      return next;
    });

    try {
      const result = await reviewVerification(verificationId, status, notes[verificationId] ?? "");
      setFeedback((current) => ({
        ...current,
        [verificationId]: { ok: result.ok, message: result.message },
      }));
      if (result.ok) router.refresh();
    } catch {
      setFeedback((current) => ({
        ...current,
        [verificationId]: { ok: false, message: "Could not save this review. Try again." },
      }));
    } finally {
      setPendingId(null);
    }
  }

  const pendingCount = verifications.filter((item) => item.status === "pending").length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Identity checks</CardTitle>
        <CardDescription>
          {verifications.length} {verifications.length === 1 ? "record" : "records"} ·{" "}
          {pendingCount} pending. Approving a NIN check raises the buyer to Tier 2; approving a
          bank account unlocks payouts.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {verifications.length === 0 ? (
          <p className="rounded-lg bg-muted px-4 py-6 text-base text-muted-foreground" role="status">
            No verification records yet.
          </p>
        ) : (
          <ul className="grid gap-4 lg:grid-cols-2">
            {verifications.map((item) => {
              const isSaving = pendingId === item.id;
              const itemFeedback = feedback[item.id];

              return (
                <li key={item.id}>
                  <article className="h-full rounded-lg border border-border bg-background p-4 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-heading text-lg font-semibold text-foreground">
                          {kindLabels[item.kind]}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {item.applicantName} · {item.applicantEmail}
                        </p>
                      </div>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[item.status]}`}>
                        {statusLabels[item.status]}
                      </span>
                    </div>

                    <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <dt className="text-muted-foreground">Provider</dt>
                        <dd className="text-foreground">{item.provider}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Reference</dt>
                        <dd className="break-all font-mono text-xs text-foreground">
                          {shortRef(item.providerRef)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Requested</dt>
                        <dd className="text-foreground">{formatDate(item.createdAt)}</dd>
                      </div>
                      {item.status !== "pending" ? (
                        <div>
                          <dt className="text-muted-foreground">Reviewed</dt>
                          <dd className="text-foreground">
                            {item.reviewedAt ? formatDate(item.reviewedAt) : "—"}
                          </dd>
                        </div>
                      ) : (
                        <div>
                          <dt className="text-muted-foreground">Attempts</dt>
                          <dd className="text-foreground">{item.attempts}</dd>
                        </div>
                      )}
                    </dl>

                    {item.status !== "pending" && item.note && (
                      <p className="mt-3 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                        Review note: {item.note}
                      </p>
                    )}

                    {item.status === "pending" && (
                      <div className="mt-3 flex flex-col gap-2">
                        <input
                          aria-label={`Review note for ${kindLabels[item.kind]} — ${item.applicantName}`}
                          placeholder="What did you check? (required)"
                          maxLength={1000}
                          value={notes[item.id] ?? ""}
                          onChange={(event) =>
                            setNotes((current) => ({ ...current, [item.id]: event.target.value }))
                          }
                          className={inputClassName}
                        />
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            onClick={() => decide(item.id, "verified")}
                            disabled={isSaving || (notes[item.id] ?? "").trim().length === 0}
                            className="flex-1"
                          >
                            Approve
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => decide(item.id, "failed")}
                            disabled={isSaving || (notes[item.id] ?? "").trim().length === 0}
                            className="flex-1"
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    )}

                    {itemFeedback && (
                      <p
                        role="status"
                        className={`mt-2 text-sm font-medium ${itemFeedback.ok ? "text-green-900" : "text-destructive"}`}
                      >
                        {itemFeedback.message}
                      </p>
                    )}
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
