"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { submitRiderApplication } from "@/app/rider/apply/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const RIDER_NOTE_MAX = 200;

export function RiderApplyForm({ contactPhone }: { contactPhone: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const form = event.currentTarget;
    setSubmitting(true);
    setError(null);

    const result = await submitRiderApplication(new FormData(form));

    if (result.ok) {
      setSuccess(result.message);
      router.refresh();
    } else {
      setError(result.message);
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <Card size="sm">
        <CardHeader>
          <CardTitle>Application received</CardTitle>
          <CardDescription>{success}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" className="w-full">
            <Link href="/marketplace">Back to marketplace</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Apply to deliver on OjaLink</CardTitle>
        <CardDescription>
          An admin reviews every application. You get rider access once yours is approved.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground" role="note">
            Your account contact phone: <span className="font-medium text-foreground">{contactPhone}</span>
            {" "}— admins use it to reach you. Update it from your profile if it is wrong.
          </p>

          <div className="grid gap-1.5">
            <label htmlFor="note" className="text-sm font-medium text-foreground">
              Tell the admin about your availability <span className="text-muted-foreground">(optional)</span>
            </label>
            <textarea
              id="note"
              name="note"
              rows={3}
              maxLength={RIDER_NOTE_MAX}
              className="rounded-md border border-input bg-background px-3 py-2 text-base text-foreground"
              placeholder="e.g. I have a bike and I am free in the evenings and weekends."
            />
          </div>

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Sending application…" : "Submit application"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
