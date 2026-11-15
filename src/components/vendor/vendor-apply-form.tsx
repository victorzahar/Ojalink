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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const form = event.currentTarget;
    setSubmitting(true);
    setError(null);

    const result = await submitVendorApplication(new FormData(form));

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
        <CardTitle>Apply to sell on OjaLink</CardTitle>
        <CardDescription>
          An admin reviews every application. You get vendor access once yours is approved.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-1.5">
            <label htmlFor="shopName" className="text-sm font-medium text-foreground">
              Shop name
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
              Market
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
              rows={3}
              maxLength={SHOP_DESCRIPTION_MAX}
              className="rounded-md border border-input bg-background px-3 py-2 text-base text-foreground"
              placeholder="e.g. Ankara, lace and quality fabric for everyday wear."
            />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="stallNumber" className="text-sm font-medium text-foreground">
              Stall number
            </label>
            <input
              id="stallNumber"
              name="stallNumber"
              type="text"
              required
              maxLength={40}
              className="h-11 rounded-md border border-input bg-background px-3 text-base text-foreground"
              placeholder="e.g. B12"
              aria-describedby="stallNumber-hint"
            />
            <p id="stallNumber-hint" className="text-xs text-muted-foreground">
              Your stall or shop number inside the market. Admins use it to find you.
            </p>
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="businessType" className="text-sm font-medium text-foreground">
              Business type
            </label>
            <select
              id="businessType"
              name="businessType"
              required
              className="h-11 rounded-md border border-input bg-background px-3 text-base text-foreground"
              defaultValue="informal"
              aria-describedby="businessType-hint"
            >
              <option value="informal">Informal trader (no CAC registration)</option>
              <option value="business_name">Registered business name</option>
              <option value="limited">Limited company</option>
            </select>
            <p id="businessType-hint" className="text-xs text-muted-foreground">
              Registered businesses must provide their CAC number below.
            </p>
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="cacNumber" className="text-sm font-medium text-foreground">
              CAC number <span className="text-muted-foreground">(registered businesses only)</span>
            </label>
            <input
              id="cacNumber"
              name="cacNumber"
              type="text"
              maxLength={20}
              className="h-11 rounded-md border border-input bg-background px-3 text-base text-foreground"
              placeholder="e.g. 1902837"
              aria-describedby="cacNumber-hint"
            />
            <p id="cacNumber-hint" className="text-xs text-muted-foreground">
              Only for registered business names and limited companies.
            </p>
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="tinNumber" className="text-sm font-medium text-foreground">
              Tax identification number (TIN) <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              id="tinNumber"
              name="tinNumber"
              type="text"
              maxLength={20}
              className="h-11 rounded-md border border-input bg-background px-3 text-base text-foreground"
              placeholder="e.g. 12345678-0001"
            />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="mapPin" className="text-sm font-medium text-foreground">
              Stall location (map pin)
            </label>
            <input
              id="mapPin"
              name="mapPin"
              type="text"
              required
              minLength={5}
              maxLength={200}
              className="h-11 rounded-md border border-input bg-background px-3 text-base text-foreground"
              placeholder="e.g. 6.4654, 3.4062 or Google Maps link"
              aria-describedby="mapPin-hint"
            />
            <p id="mapPin-hint" className="text-xs text-muted-foreground">
              Paste a pin or link so the rider can find your stall at pickup.
            </p>
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
