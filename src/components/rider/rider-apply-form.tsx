"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { submitRiderApplication } from "@/app/rider/apply/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const RIDER_NOTE_MAX = 200;

const inputClassName =
  "h-11 rounded-md border border-input bg-background px-3 text-base text-foreground";

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
            <Link href="/">Back home</Link>
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
          An admin reviews every application and calls your two guarantors before you get rider
          access. Your phone number must be verified first.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-1.5">
            <label htmlFor="vehicleType" className="text-sm font-medium text-foreground">
              Vehicle type
            </label>
            <select id="vehicleType" name="vehicleType" required className={inputClassName} defaultValue="motorbike">
              <option value="motorbike">Motorbike</option>
              <option value="tricycle">Tricycle (Keke)</option>
              <option value="car">Car</option>
            </select>
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="plateNumber" className="text-sm font-medium text-foreground">
              Plate number
            </label>
            <input
              id="plateNumber"
              name="plateNumber"
              type="text"
              required
              pattern="[A-Za-z0-9-]{5,12}"
              maxLength={12}
              className={inputClassName}
              placeholder="e.g. LA-123-AB"
              aria-describedby="plateNumber-hint"
            />
            <p id="plateNumber-hint" className="text-xs text-muted-foreground">
              5–12 characters, letters, numbers and dashes. Buyers see this when you pick up.
            </p>
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="homeMapPin" className="text-sm font-medium text-foreground">
              Where do you live? (map pin)
            </label>
            <input
              id="homeMapPin"
              name="homeMapPin"
              type="text"
              required
              minLength={5}
              maxLength={200}
              className={inputClassName}
              placeholder="e.g. 6.4654, 3.4062 or Google Maps link"
              aria-describedby="homeMapPin-hint"
            />
            <p id="homeMapPin-hint" className="text-xs text-muted-foreground">
              A pin or link so we know your base area. Only admins see this.
            </p>
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="emergencyContactName" className="text-sm font-medium text-foreground">
              Emergency contact name
            </label>
            <input
              id="emergencyContactName"
              name="emergencyContactName"
              type="text"
              required
              maxLength={80}
              className={inputClassName}
              placeholder="e.g. Ngozi Okon"
            />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="emergencyContactPhone" className="text-sm font-medium text-foreground">
              Emergency contact phone
            </label>
            <input
              id="emergencyContactPhone"
              name="emergencyContactPhone"
              type="tel"
              required
              className={inputClassName}
              placeholder="e.g. 0801 234 5678"
            />
          </div>

          <div className="rounded-md border border-border bg-muted/40 p-3">
            <p className="text-sm font-semibold text-foreground">Guarantor 1</p>
            <div className="mt-2 grid gap-2">
              <input
                aria-label="Guarantor 1 name"
                name="guarantor1Name"
                type="text"
                required
                maxLength={80}
                className={inputClassName}
                placeholder="Full name"
              />
              <input
                aria-label="Guarantor 1 phone"
                name="guarantor1Phone"
                type="tel"
                required
                className={inputClassName}
                placeholder="Phone number"
              />
              <input
                aria-label="Guarantor 1 relationship to you"
                name="guarantor1Relation"
                type="text"
                required
                maxLength={60}
                className={inputClassName}
                placeholder="Relationship, e.g. Family friend"
              />
            </div>

            <p className="mt-4 text-sm font-semibold text-foreground">Guarantor 2</p>
            <div className="mt-2 grid gap-2">
              <input
                aria-label="Guarantor 2 name"
                name="guarantor2Name"
                type="text"
                required
                maxLength={80}
                className={inputClassName}
                placeholder="Full name"
              />
              <input
                aria-label="Guarantor 2 phone"
                name="guarantor2Phone"
                type="tel"
                required
                className={inputClassName}
                placeholder="Phone number"
              />
              <input
                aria-label="Guarantor 2 relationship to you"
                name="guarantor2Relation"
                type="text"
                required
                maxLength={60}
                className={inputClassName}
                placeholder="Relationship, e.g. Landlord"
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Two different people, each on their own phone number. An admin calls both before you
              are approved. Your contact ({contactPhone}) cannot double as a guarantor.
            </p>
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="note" className="text-sm font-medium text-foreground">
              Anything else? <span className="text-muted-foreground">(optional)</span>
            </label>
            <textarea
              id="note"
              name="note"
              rows={3}
              maxLength={RIDER_NOTE_MAX}
              className="rounded-md border border-input bg-background px-3 py-2 text-base text-foreground"
              placeholder="e.g. I deliver around Yaba and Surulere."
            />
          </div>

          <div className="flex items-start gap-2">
            <input
              id="trainingConfirmed"
              name="trainingConfirmed"
              type="checkbox"
              required
              className="mt-1 h-4 w-4"
              aria-describedby="trainingConfirmed-hint"
            />
            <label htmlFor="trainingConfirmed" className="text-sm text-foreground" id="trainingConfirmed-hint">
              I confirm I have read the OjaLink rider training guide: carry orders safely, show the
              buyer your plate, and collect the 4-digit handover code before leaving goods.
            </label>
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
