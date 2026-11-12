"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { submitRiderApplication } from "@/app/rider/apply/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const RIDER_NOTE_MAX = 200;

export function RiderApplyForm({
  contactPhone,
  isReapply = false,
}: {
  contactPhone: string;
  isReapply?: boolean;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // File upload state for display
  const [portraitName, setPortraitName] = useState<string | null>(null);
  const [guarantorDocName, setGuarantorDocName] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const form = event.currentTarget;
    setSubmitting(true);
    setError(null);

    const formData = new FormData(form);
    if (isReapply) {
      formData.set("reapply", "true");
    }

    const result = await submitRiderApplication(formData);

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
            <Link href="/buyer">Go to buyer dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Rider Application & Verification</CardTitle>
        <CardDescription>
          Provide your vehicle details and Nigerian verification documents. Admins review all credentials before granting delivery access.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Section 1: Logistics & Vehicle */}
          <div className="space-y-3 border-b border-border pb-4">
            <h3 className="text-sm font-semibold text-foreground">1. Vehicle & Logistics</h3>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <label htmlFor="vehicleType" className="text-sm font-medium text-foreground">
                  Vehicle type <span className="text-destructive">*</span>
                </label>
                <select
                  id="vehicleType"
                  name="vehicleType"
                  required
                  defaultValue="Motorcycle (Okada)"
                  className="h-11 rounded-md border border-input bg-background px-3 text-base text-foreground"
                >
                  <option value="Motorcycle (Okada)">Motorcycle (Okada)</option>
                  <option value="Bicycle">Bicycle</option>
                  <option value="Electric Scooter">Electric Scooter</option>
                  <option value="Delivery Van / Car">Delivery Van / Car</option>
                </select>
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="plateNumber" className="text-sm font-medium text-foreground">
                  Plate / Registration number <span className="text-destructive">*</span>
                </label>
                <input
                  id="plateNumber"
                  name="plateNumber"
                  type="text"
                  required
                  placeholder="e.g. EDO-452-BEN (or N/A)"
                  className="h-11 rounded-md border border-input bg-background px-3 text-base text-foreground"
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="deliveryZone" className="text-sm font-medium text-foreground">
                Primary delivery zone in Benin City <span className="text-destructive">*</span>
              </label>
              <input
                id="deliveryZone"
                name="deliveryZone"
                type="text"
                required
                defaultValue="Ugbowo / UNIBEN Campus / Oluku"
                placeholder="e.g. Ugbowo, Ring Road, GRA, New Benin"
                className="h-11 rounded-md border border-input bg-background px-3 text-base text-foreground"
              />
            </div>
          </div>

          {/* Section 2: Identity & Required Photos */}
          <div className="space-y-3 border-b border-border pb-4">
            <h3 className="text-sm font-semibold text-foreground">2. Identity & Photos</h3>
            <p className="text-xs text-muted-foreground">
              Required for customer trust and delivery verification. In development mode, demo test photos will automatically be used if no files are uploaded.
            </p>

            <div className="grid gap-1.5">
              <label htmlFor="portrait" className="text-sm font-medium text-foreground">
                Your personal portrait photo
              </label>
              <input
                id="portrait"
                name="portrait"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setPortraitName(e.target.files?.[0]?.name || null)}
                className="text-sm file:mr-3 file:rounded-md file:border file:border-input file:bg-background file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground"
              />
              <p className="text-xs text-muted-foreground">
                {portraitName ? `Selected: ${portraitName}` : "Clear front-facing photo of yourself. Max 3MB."}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <label htmlFor="nin" className="text-sm font-medium text-foreground">
                  NIN (11 digits) <span className="text-destructive">*</span>
                </label>
                <input
                  id="nin"
                  name="nin"
                  type="text"
                  pattern="[0-9]{11}"
                  maxLength={11}
                  required
                  placeholder="e.g. 12345678901"
                  className="h-11 rounded-md border border-input bg-background px-3 text-base text-foreground"
                />
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="phone" className="text-sm font-medium text-foreground">
                  Phone (WhatsApp / OTP) <span className="text-destructive">*</span>
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  defaultValue={contactPhone}
                  placeholder="e.g. 08012345678"
                  className="h-11 rounded-md border border-input bg-background px-3 text-base text-foreground"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <label htmlFor="emergencyName" className="text-sm font-medium text-foreground">
                  Emergency contact name <span className="text-destructive">*</span>
                </label>
                <input
                  id="emergencyName"
                  name="emergencyName"
                  type="text"
                  required
                  placeholder="e.g. Osasere Agbonlahor"
                  className="h-11 rounded-md border border-input bg-background px-3 text-base text-foreground"
                />
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="emergencyPhone" className="text-sm font-medium text-foreground">
                  Emergency contact phone <span className="text-destructive">*</span>
                </label>
                <input
                  id="emergencyPhone"
                  name="emergencyPhone"
                  type="tel"
                  required
                  placeholder="e.g. 08098765432"
                  className="h-11 rounded-md border border-input bg-background px-3 text-base text-foreground"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Payout Bank Account */}
          <div className="space-y-3 border-b border-border pb-4">
            <h3 className="text-sm font-semibold text-foreground">3. Bank Account for Weekly Payouts</h3>
            <p className="text-xs text-muted-foreground">
              Your weekly delivery earnings and tips will be transferred directly to this Nigerian bank account.
            </p>

            <div className="grid gap-1.5">
              <label htmlFor="bankName" className="text-sm font-medium text-foreground">
                Bank name <span className="text-destructive">*</span>
              </label>
              <input
                id="bankName"
                name="bankName"
                type="text"
                required
                placeholder="e.g. Access Bank, GTBank, First Bank, Zenith, OPay"
                className="h-11 rounded-md border border-input bg-background px-3 text-base text-foreground"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <label htmlFor="bankAccountNumber" className="text-sm font-medium text-foreground">
                  NUBAN Account number (10 digits) <span className="text-destructive">*</span>
                </label>
                <input
                  id="bankAccountNumber"
                  name="bankAccountNumber"
                  type="text"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  required
                  placeholder="e.g. 0123456789"
                  className="h-11 rounded-md border border-input bg-background px-3 text-base text-foreground"
                />
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="bankAccountName" className="text-sm font-medium text-foreground">
                  Account holder name <span className="text-destructive">*</span>
                </label>
                <input
                  id="bankAccountName"
                  name="bankAccountName"
                  type="text"
                  required
                  placeholder="e.g. Osasere Agbonlahor"
                  className="h-11 rounded-md border border-input bg-background px-3 text-base text-foreground"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Trust & Guarantor */}
          <div className="space-y-3 border-b border-border pb-4">
            <h3 className="text-sm font-semibold text-foreground">4. Guarantor Information & Document Check</h3>
            <p className="text-xs text-muted-foreground">
              Contact info of an adult guarantor resident in Benin City or Edo State (e.g. Landlord, Community Leader, Employer, or Parent).
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <label htmlFor="guarantorName" className="text-sm font-medium text-foreground">
                  Guarantor full name <span className="text-destructive">*</span>
                </label>
                <input
                  id="guarantorName"
                  name="guarantorName"
                  type="text"
                  required
                  placeholder="e.g. Chief Osaro Igbinedion"
                  className="h-11 rounded-md border border-input bg-background px-3 text-base text-foreground"
                />
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="guarantorPhone" className="text-sm font-medium text-foreground">
                  Guarantor reachable phone <span className="text-destructive">*</span>
                </label>
                <input
                  id="guarantorPhone"
                  name="guarantorPhone"
                  type="tel"
                  required
                  placeholder="e.g. 08023456789"
                  className="h-11 rounded-md border border-input bg-background px-3 text-base text-foreground"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <label htmlFor="guarantorRelationship" className="text-sm font-medium text-foreground">
                  Relationship <span className="text-destructive">*</span>
                </label>
                <select
                  id="guarantorRelationship"
                  name="guarantorRelationship"
                  required
                  defaultValue="Landlord / Property Owner"
                  className="h-11 rounded-md border border-input bg-background px-3 text-base text-foreground"
                >
                  <option value="Landlord / Property Owner">Landlord / Property Owner</option>
                  <option value="Community / Religious Leader">Community / Religious Leader</option>
                  <option value="Former / Current Employer">Former / Current Employer</option>
                  <option value="Parent / Senior Relative">Parent / Senior Relative</option>
                  <option value="Civil Servant / Professional">Civil Servant / Professional</option>
                </select>
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="guarantorAddress" className="text-sm font-medium text-foreground">
                  Guarantor address in Benin City <span className="text-destructive">*</span>
                </label>
                <input
                  id="guarantorAddress"
                  name="guarantorAddress"
                  type="text"
                  required
                  placeholder="e.g. 14 Akpakpava Street, Benin City"
                  className="h-11 rounded-md border border-input bg-background px-3 text-base text-foreground"
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="guarantorDoc" className="text-sm font-medium text-foreground">
                Signed Guarantor Letter / ID Document <span className="text-muted-foreground">(optional)</span>
              </label>
              <input
                id="guarantorDoc"
                name="guarantorDoc"
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={(e) => setGuarantorDocName(e.target.files?.[0]?.name || null)}
                className="text-sm file:mr-3 file:rounded-md file:border file:border-input file:bg-background file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground"
              />
              <p className="text-xs text-muted-foreground">
                {guarantorDocName
                  ? `Selected: ${guarantorDocName}`
                  : "Signed letter or government ID. If not uploaded now, admin verifies via phone call."}
              </p>
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="note" className="text-sm font-medium text-foreground">
                Availability & Delivery schedule <span className="text-muted-foreground">(optional)</span>
              </label>
              <textarea
                id="note"
                name="note"
                rows={2}
                maxLength={RIDER_NOTE_MAX}
                className="rounded-md border border-input bg-background px-3 py-2 text-base text-foreground"
                placeholder="e.g. Available daily from 8am to 7pm around Ugbowo and Ring Road."
              />
            </div>
          </div>

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting
              ? "Submitting rider application…"
              : isReapply
              ? "Re-submit application for review"
              : "Submit rider application"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
