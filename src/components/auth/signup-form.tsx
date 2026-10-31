"use client";

import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authClient, authErrorMessage } from "@/lib/auth/client";

const ariaInvalidIf = (hasError: boolean) => (hasError ? (true as const) : undefined);

export function SignupForm() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
  } | null>(null);

  async function handleSubmit(formData: FormData) {
    setIsPending(true);
    setFormError(null);
    setFieldErrors(null);

    const name = String(formData.get("name") ?? "");
    const email = String(formData.get("email") ?? "");
    const phone = String(formData.get("phone") ?? "");
    const password = String(formData.get("password") ?? "");

    // Client-side sanity checks so users see friendly messages fast.
    const errors: typeof fieldErrors = {};
    if (name.trim().length < 2) errors.name = "Please enter your full name (at least 2 characters).";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Please enter a valid email address.";
    if (phone && !/^\+?[0-9\s-]{7,15}$/.test(phone)) errors.phone = "Use only numbers, spaces or dashes, e.g. +234 801 234 5678.";
    if (password.length < 8) errors.password = "Password must be at least 8 characters long.";

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

    // Sign-up created a session. Every new account is a buyer; the server
    // ignores any role value, so go straight to the buyer area.
    router.push("/buyer");
    router.refresh();
  }

  return (
    <Card size="sm" className="gap-0 rounded-xl py-6">
      <CardContent className="flex flex-col gap-4">
        <form onSubmit={(event) => { event.preventDefault(); void handleSubmit(new FormData(event.currentTarget)); }} className="flex flex-col gap-4">
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
