"use client";

import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { submitSignupApplication } from "@/app/(auth)/signup/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authClient, authErrorMessage } from "@/lib/auth/client";
import { parseSignupRole, signupLandingPath, type SignupRole } from "@/lib/auth/signup-role";

const SHOP_NAME_MAX = 80;
const SHOP_DESCRIPTION_MAX = 300;
const RIDER_NOTE_MAX = 200;

type MarketOption = {
  name: string;
  slug: string;
  area: string;
};

const ariaInvalidIf = (hasError: boolean) => (hasError ? (true as const) : undefined);

const roleChoices: { value: SignupRole; label: string; description: string }[] = [
  { value: "buyer", label: "Buyer", description: "Shop from Benin City markets. Instant access." },
  { value: "vendor", label: "Vendor", description: "Open a shop. An admin approves your application." },
  { value: "rider", label: "Rider", description: "Deliver orders. An admin approves your application." },
];

export function SignupForm({ markets }: { markets: MarketOption[] }) {
  const router = useRouter();
  const [signupRole, setSignupRole] = useState<SignupRole>("buyer");
  const [isPending, setIsPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
    shopName?: string;
    marketSlug?: string;
  } | null>(null);

  async function handleSubmit(formData: FormData) {
    setIsPending(true);
    setFormError(null);
    setFieldErrors(null);

    const name = String(formData.get("name") ?? "");
    const email = String(formData.get("email") ?? "");
    const phone = String(formData.get("phone") ?? "");
    const password = String(formData.get("password") ?? "");
    const shopName = String(formData.get("shopName") ?? "");
    const marketSlug = String(formData.get("marketSlug") ?? "");

    // Client-side sanity checks so users see friendly messages fast.
    const errors: typeof fieldErrors = {};
    if (name.trim().length < 2) errors.name = "Please enter your full name (at least 2 characters).";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Please enter a valid email address.";
    if (phone && !/^\+?[0-9\s-]{7,15}$/.test(phone)) errors.phone = "Use only numbers, spaces or dashes, e.g. +234 801 234 5678.";
    if (password.length < 8) errors.password = "Password must be at least 8 characters long.";
    if (signupRole === "vendor") {
      if (shopName.trim().length < 2) errors.shopName = "Please enter your shop name (at least 2 characters).";
      if (!marketSlug) errors.marketSlug = "Choose the market you sell in.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setIsPending(false);
      return;
    }

    const body: { name: string; email: string; password: string; phone?: string } = { name, email, password };
    if (phone) body.phone = phone;

    let error: Awaited<ReturnType<typeof authClient.signUpEmail>>["error"] = null;
    try {
      ({ error } = await authClient.signUpEmail(body));
    } catch {
      // Network failure: no HTTP status at all.
      setFormError(authErrorMessage(null));
      setIsPending(false);
      return;
    }

    if (error) {
      // Status-based only: 401 → "Wrong email or password", 429 → "Too many
      // attempts…", anything else → generic (real status logged in dev only).
      setFormError(authErrorMessage(error));
      setIsPending(false);
      return;
    }

    // Sign-up created a session. The account is a buyer in the database; file
    // the chosen application for admin approval. Vendor/rider fields ride
    // along in the same form data the apply actions already validate.
    let applicationSubmitted = false;
    if (signupRole !== "buyer") {
      const application = await submitSignupApplication(formData);
      applicationSubmitted = application.ok && application.submitted;
    }

    // A submitted application has its own waiting-for-approval page; if it
    // could not be filed, the buyer area still offers both apply buttons.
    router.push(signupLandingPath(parseSignupRole(signupRole) ?? "buyer", applicationSubmitted));
    router.refresh();
  }

  return (
    <Card size="sm" className="gap-0 rounded-xl py-6">
      <CardContent className="flex flex-col gap-4">
        <form onSubmit={(event) => { event.preventDefault(); void handleSubmit(new FormData(event.currentTarget)); }} className="flex flex-col gap-4">
          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium text-foreground">I want to join as</legend>
            {roleChoices.map((choice) => (
              <label
                key={choice.value}
                className="flex cursor-pointer items-start gap-3 rounded-md border border-input bg-background px-3 py-2.5 has-checked:border-primary has-checked:bg-primary/5"
              >
                <input
                  type="radio"
                  name="signupRole"
                  value={choice.value}
                  checked={signupRole === choice.value}
                  onChange={() => setSignupRole(choice.value)}
                  className="mt-1 size-4 accent-primary"
                />
                <span>
                  <span className="block text-sm font-medium text-foreground">{choice.label}</span>
                  <span className="block text-sm text-muted-foreground">{choice.description}</span>
                </span>
              </label>
            ))}
          </fieldset>

          {signupRole === "vendor" && (
            <>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="shopName" className="text-sm font-medium text-foreground">Shop name</label>
                <Input id="shopName" name="shopName" type="text" maxLength={SHOP_NAME_MAX} placeholder="e.g. Adaeze Fabrics" aria-invalid={ariaInvalidIf(Boolean(fieldErrors?.shopName))} required />
                {fieldErrors?.shopName && <p className="text-sm text-destructive" role="alert">{fieldErrors.shopName}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="marketSlug" className="text-sm font-medium text-foreground">Market</label>
                <select
                  id="marketSlug"
                  name="marketSlug"
                  className="h-11 rounded-md border border-input bg-background px-3 text-base text-foreground"
                  defaultValue=""
                  aria-invalid={ariaInvalidIf(Boolean(fieldErrors?.marketSlug))}
                  required
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
                {fieldErrors?.marketSlug && <p className="text-sm text-destructive" role="alert">{fieldErrors.marketSlug}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="description" className="text-sm font-medium text-foreground">
                  What do you sell? <span className="text-muted-foreground font-normal">(optional)</span>
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
            </>
          )}

          {signupRole === "rider" && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="note" className="text-sm font-medium text-foreground">
                Tell the admin about your availability <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <textarea
                id="note"
                name="note"
                rows={2}
                maxLength={RIDER_NOTE_MAX}
                className="rounded-md border border-input bg-background px-3 py-2 text-base text-foreground"
                placeholder="e.g. I have a bike and I am free in the evenings and weekends."
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-sm font-medium text-foreground">Full name</label>
            <Input id="name" name="name" type="text" autoComplete="name" placeholder="e.g. Amaka Nwosu" aria-invalid={ariaInvalidIf(Boolean(fieldErrors?.name))} required />
            {fieldErrors?.name && <p className="text-sm text-destructive" role="alert">{fieldErrors.name}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-foreground">Email</label>
            <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" aria-invalid={ariaInvalidIf(Boolean(fieldErrors?.email))} required />
            {fieldErrors?.email && <p className="text-sm text-destructive" role="alert">{fieldErrors.email}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="phone" className="text-sm font-medium text-foreground">Phone number <span className="text-muted-foreground font-normal">(optional)</span></label>
            <Input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="+234 801 234 5678" aria-invalid={ariaInvalidIf(Boolean(fieldErrors?.phone))} />
            {fieldErrors?.phone && <p className="text-sm text-destructive" role="alert">{fieldErrors.phone}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-foreground">Password</label>
            <Input id="password" name="password" type="password" autoComplete="new-password" placeholder="At least 8 characters" aria-invalid={ariaInvalidIf(Boolean(fieldErrors?.password))} required minLength={8} />
            <p className="text-sm text-muted-foreground">At least 8 characters.</p>
            {fieldErrors?.password && <p className="text-sm text-destructive" role="alert">{fieldErrors.password}</p>}
          </div>

          {formError && (
            <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
              {formError}
            </p>
          )}

          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating your account…" : "Create account"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            Log in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
