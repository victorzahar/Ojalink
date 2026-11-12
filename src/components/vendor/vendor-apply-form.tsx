"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { submitVendorApplication } from "@/app/vendor/apply/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type MarketOption = {
  name: string;
  slug: string;
  area: string;
};

const SHOP_NAME_MAX = 80;
const SHOP_DESCRIPTION_MAX = 300;

export function VendorApplyForm({ markets }: { markets: MarketOption[] }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // File preview states
  const [portraitName, setPortraitName] = useState<string | null>(null);
  const [shopImageName, setShopImageName] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const form = event.currentTarget;
    setSubmitting(true);
    setError(null);

    const formData = new FormData(form);
    const result = await submitVendorApplication(formData);

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
        <CardTitle>Vendor Application & Verification</CardTitle>
        <CardDescription>
          Provide your shop details and Nigerian verification documents. Admins review all credentials before granting vendor access.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Section 1: Shop & Market */}
          <div className="space-y-3 border-b border-border pb-4">
            <h3 className="text-sm font-semibold text-foreground">1. Shop Information</h3>

            <div className="grid gap-1.5">
              <label htmlFor="shopName" className="text-sm font-medium text-foreground">
                Shop name <span className="text-destructive">*</span>
              </label>
              <input
                id="shopName"
                name="shopName"
                type="text"
                required
                maxLength={SHOP_NAME_MAX}
                className="h-11 rounded-md border border-input bg-background px-3 text-base text-foreground"
                placeholder="e.g. Adaeze Fabrics"
                aria-describedby="shopName-hint"
              />
              <p id="shopName-hint" className="text-xs text-muted-foreground">
                Up to {SHOP_NAME_MAX} characters. Shoppers will see this name on your storefront.
              </p>
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="marketSlug" className="text-sm font-medium text-foreground">
                Market location <span className="text-destructive">*</span>
              </label>
              <select
                id="marketSlug"
                name="marketSlug"
                required
                className="h-11 rounded-md border border-input bg-background px-3 text-base text-foreground"
                defaultValue=""
              >
                <option value="" disabled>
                  Choose the market you sell in
                </option>
                {markets.map((market) => (
                  <option key={market.slug} value={market.slug}>
                    {market.name} — {market.area}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="description" className="text-sm font-medium text-foreground">
                What do you sell? <span className="text-muted-foreground">(optional)</span>
              </label>
              <textarea
                id="description"
                name="description"
                rows={2}
                maxLength={SHOP_DESCRIPTION_MAX}
                className="rounded-md border border-input bg-background px-3 py-2 text-base text-foreground"
                placeholder="e.g. Ankara, lace and quality fabric for everyday wear."
              />
            </div>
          </div>

          {/* Section 2: Identity & Required Photos */}
          <div className="space-y-3 border-b border-border pb-4">
            <h3 className="text-sm font-semibold text-foreground">2. Identity & Photos</h3>
            <p className="text-xs text-muted-foreground">
              Required for admin verification. In development mode, demo test photos will automatically be used if no files are uploaded.
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

            <div className="grid gap-1.5">
              <label htmlFor="shopImage" className="text-sm font-medium text-foreground">
                Photo of your shop front or market stall
              </label>
              <input
                id="shopImage"
                name="shopImage"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setShopImageName(e.target.files?.[0]?.name || null)}
                className="text-sm file:mr-3 file:rounded-md file:border file:border-input file:bg-background file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground"
              />
              <p className="text-xs text-muted-foreground">
                {shopImageName ? `Selected: ${shopImageName}` : "Photo showing your market stall, shop banner, or goods display. Max 3MB."}
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
                  placeholder="e.g. 08012345678"
                  className="h-11 rounded-md border border-input bg-background px-3 text-base text-foreground"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Payout Bank Account */}
          <div className="space-y-3 border-b border-border pb-4">
            <h3 className="text-sm font-semibold text-foreground">3. Bank Account for Weekly Payouts</h3>
            <p className="text-xs text-muted-foreground">
              Account name must match your legal name or registered business name for Paystack verification.
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
                <label htmlFor="accountNumber" className="text-sm font-medium text-foreground">
                  NUBAN Account number (10 digits) <span className="text-destructive">*</span>
                </label>
                <input
                  id="accountNumber"
                  name="accountNumber"
                  type="text"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  required
                  placeholder="e.g. 0123456789"
                  className="h-11 rounded-md border border-input bg-background px-3 text-base text-foreground"
                />
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="accountName" className="text-sm font-medium text-foreground">
                  Account holder name <span className="text-destructive">*</span>
                </label>
                <input
                  id="accountName"
                  name="accountName"
                  type="text"
                  required
                  placeholder="e.g. Adaeze Okafor"
                  className="h-11 rounded-md border border-input bg-background px-3 text-base text-foreground"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Trust & Guarantor */}
          <div className="space-y-3 border-b border-border pb-4">
            <h3 className="text-sm font-semibold text-foreground">4. Guarantor / Market Reference</h3>
            <p className="text-xs text-muted-foreground">
              Contact info of a market union leader, elder, or adult guarantor resident in Benin City.
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
                  placeholder="e.g. Chief Osagie Egharevba"
                  className="h-11 rounded-md border border-input bg-background px-3 text-base text-foreground"
                />
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="guarantorPhone" className="text-sm font-medium text-foreground">
                  Guarantor phone number <span className="text-destructive">*</span>
                </label>
                <input
                  id="guarantorPhone"
                  name="guarantorPhone"
                  type="tel"
                  required
                  placeholder="e.g. 08098765432"
                  className="h-11 rounded-md border border-input bg-background px-3 text-base text-foreground"
                />
              </div>
            </div>
          </div>

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Submitting application & verification documents…" : "Submit vendor application"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
