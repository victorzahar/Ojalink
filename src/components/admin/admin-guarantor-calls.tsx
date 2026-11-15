"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { recordGuarantorCall } from "@/app/admin/verifications/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type GuarantorOutcome = "pending" | "reachable" | "unreachable";

type AdminGuarantor = {
  id: string;
  name: string;
  phone: string;
  relation: string;
  outcome: GuarantorOutcome;
  callNote: string | null;
  createdAt: Date;
  applicantName: string;
  applicantEmail: string;
};

const outcomeLabels: Record<GuarantorOutcome, string> = {
  pending: "Call pending",
  reachable: "Reachable",
  unreachable: "Unreachable",
};

const outcomeStyles: Record<GuarantorOutcome, string> = {
  pending: "bg-amber-100 text-amber-900",
  reachable: "bg-green-100 text-green-900",
  unreachable: "bg-red-100 text-red-900",
};

const inputClassName =
  "h-11 rounded-md border border-input bg-background px-3 text-base text-foreground";

export function AdminGuarantorCalls({ guarantors }: { guarantors: AdminGuarantor[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, { ok: boolean; message: string }>>({});

  async function record(guarantorId: string, outcome: "reachable" | "unreachable") {
    setPendingId(guarantorId);
    setFeedback((current) => {
      const next = { ...current };
      delete next[guarantorId];
      return next;
    });

    try {
      const result = await recordGuarantorCall(guarantorId, outcome, notes[guarantorId] ?? "");
      setFeedback((current) => ({
        ...current,
        [guarantorId]: { ok: result.ok, message: result.message },
      }));
      if (result.ok) router.refresh();
    } catch {
      setFeedback((current) => ({
        ...current,
        [guarantorId]: { ok: false, message: "Could not save this call. Try again." },
      }));
    } finally {
      setPendingId(null);
    }
  }

  const pendingCount = guarantors.filter((item) => item.outcome === "pending").length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Guarantor calls</CardTitle>
        <CardDescription>
          {guarantors.length} {guarantors.length === 1 ? "guarantor" : "guarantors"} · {pendingCount}{" "}
          {pendingCount === 1 ? "call" : "calls"} pending. Record every call — rider approvals wait
          on two reachable guarantors.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {guarantors.length === 0 ? (
          <p className="rounded-lg bg-muted px-4 py-6 text-base text-muted-foreground" role="status">
            No guarantors listed yet.
          </p>
        ) : (
          <ul className="grid gap-4 lg:grid-cols-2">
            {guarantors.map((item) => {
              const isSaving = pendingId === item.id;
              const itemFeedback = feedback[item.id];

              return (
                <li key={item.id}>
                  <article className="h-full rounded-lg border border-border bg-background p-4 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-heading text-lg font-semibold text-foreground">
                          {item.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {item.phone} · {item.relation}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          For {item.applicantName} ({item.applicantEmail})
                        </p>
                      </div>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${outcomeStyles[item.outcome]}`}>
                        {outcomeLabels[item.outcome]}
                      </span>
                    </div>

                    {item.outcome !== "pending" && item.callNote && (
                      <p className="mt-3 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                        Call note: {item.callNote}
                      </p>
                    )}

                    {item.outcome === "pending" && (
                      <div className="mt-3 flex flex-col gap-2">
                        <input
                          aria-label={`Call note for ${item.name} — guarantor of ${item.applicantName}`}
                          placeholder="What did they say? (required)"
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
                            onClick={() => record(item.id, "reachable")}
                            disabled={isSaving || (notes[item.id] ?? "").trim().length === 0}
                            className="flex-1"
                          >
                            Reachable
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => record(item.id, "unreachable")}
                            disabled={isSaving || (notes[item.id] ?? "").trim().length === 0}
                            className="flex-1"
                          >
                            Unreachable
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
