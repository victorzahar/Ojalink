"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { submitRiderApplication } from "@/app/rider/apply/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const RIDER_NOTE_MAX = 200;

const NIGERIAN_BANKS = [
  "Access Bank",
  "Citibank Nigeria",
  "Ecobank Nigeria",
  "Fidelity Bank",
  "First Bank of Nigeria",
  "First City Monument Bank (FCMB)",
  "Guaranty Trust Bank (GTBank)",
  "Heritage Bank",
  "Keystone Bank",
  "Kuda Bank",
  "Moniepoint MFB",
  "OPay",
  "PalmPay",
  "Polaris Bank",
  "Stanbic IBTC Bank",
  "Standard Chartered Bank",
  "Sterling Bank",
  "Union Bank of Nigeria",
  "United Bank for Africa (UBA)",
  "Unity Bank",
  "Wema Bank / ALAT",
  "Zenith Bank",
];

const BENIN_CITY_ZONES = [
  "Ring Road / Oba Market / City Centre",
  "Ugbowo / UNIBEN Campus / Oluku",
  "GRA / Airport Road",
  "New Benin / Mission Road",
  "Ikpoba Hill / Aduwawa",
  "Ekenwan Road / Dumez",
  "Sapele Road / Country Home",
  "Upper Sokponba / St. Saviour",
];

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

  // File preview states
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
        <CardTitle>{isReapply ? "Update Rider Verification Documents" : "Apply to Deliver on OjaLink"}</CardTitle>
        <CardDescription>
          {isReapply
            ? "Update your logistics, identification, and guarantor details to re-submit your rider application for admin review."
            : "Provide your vehicle, identity, and guarantor verification details. Admins verify every rider to protect shoppers and vendors across Benin City."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isReapply && (
          <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900" role="alert">
            <p className="font-semibold">Re-applying for Rider Access</p>
            <p className="mt-0.5 text-xs">
              Your previous application was not approved. Please verify that your vehicle registration, 11-digit NIN, and guarantor letter details are accurate and clearly readable.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Section 1: Logistics & Vehicle */}
          <div className="space-y-3 border-b border-border pb-4">
            <h3 className="text-sm font-semibold text-foreground">1. Logistics & Vehicle</h3>

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
                  placeholder="e.g. EDO-452-BEN (or N/A for bicycle)"
                  className="h-11 rounded-md border border-input bg-background px-3 text-base text-foreground"
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="deliveryZone" className="text-sm font-medium text-foreground">
                Primary delivery zone in Benin City <span className="text-destructive">*</span>
              </label>
              <select
                id="deliveryZone"
                name="deliveryZone"
                required
                defaultValue="Ugbowo / UNIBEN Campus / Oluku"
                className="h-11 rounded-md border border-input bg-background px-3 text-base text-foreground"
              >
                {BENIN_CITY_ZONES.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 2: Identity & Required Photos */}
          <div className="space-y-3 border-b border-border pb-4">
            <h3 className="text-sm font-semibold text-foreground">2. Rider Identity & Photos</h3>
            <p className="text-xs text-muted-foreground">
              Required for customer trust and delivery verification. In development mode, demo test photos will automatically be used if no files are uploaded.
            </p>

            <div className="grid gap-1.5">
              <label htmlFor="portrait" className="text-sm font-medium text-foreground">
                Your personal portrait photo <span className="text-muted-foreground">(passport / clear selfie)</span>
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
                {portraitName ? `Selected: ${portraitName}` : "Clear front-facing photo of your face. Max 3MB."}
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
                  Phone (Calls / WhatsApp) <span className="text-destructive">*</span>
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

          {/* Section 3: Delivery Payout Bank Account */}
          <div className="space-y-3 border-b border-border pb-4">
            <h3 className="text-sm font-semibold text-foreground">3. Bank Account for Delivery Earnings</h3>
            <p className="text-xs text-muted-foreground">
              Your weekly delivery fees and tips will be transferred directly to this Nigerian bank account.
            </p>

            <div className="grid gap-1.5">
              <label htmlFor="bankName" className="text-sm font-medium text-foreground">
                Bank name <span className="text-destructive">*</span>
              </label>
              <select
                id="bankName"
                name="bankName"
                required
                defaultValue=""
                className="h-11 rounded-md border border-input bg-background px-3 text-base text-foreground"
              >
                <option value="" disabled>
                  Select your bank
                </option>
                {NIGERIAN_BANKS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <label htmlFor="bankAccountNumber" className="text-sm font-medium text-foreground">
                  NUBAN (10 digits) <span className="text-destructive">*</span>
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
                  Account name <span className="text-destructive">*</span>
                </label>
                <input
                  id="bankAccountName"
                  name="bankAccountName"
                  type="text"
                  required
                  placeholder="Legal account name"
                  className="h-11 rounded-md border border-input bg-background px-3 text-base text-foreground"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Guarantor Letter & Signature Verification */}
          <div className="space-y-3 border-b border-border pb-4">
            <h3 className="text-sm font-semibold text-foreground">4. Guarantor Information & Document Check</h3>
            <p className="text-xs text-muted-foreground">
              Every OjaLink rider must have a verified Nigerian adult guarantor resident in Benin City or Edo State (e.g. Landlord, Community Leader, Employer, or Parent).
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
                Signed Guarantor Letter / ID Document <span className="text-muted-foreground">(Optional file upload)</span>
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
                  : "Signed letter or guarantor government ID. If not uploaded now, admin will verify via phone confirmation."}
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
                placeholder="e.g. Available every day 8am to 7pm around Ugbowo and Ring Road."
              />
            </div>
          </div>

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Sending application…" : isReapply ? "Re-submit application for review" : "Submit rider application"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
