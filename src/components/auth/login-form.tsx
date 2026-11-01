"use client";

import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authClient, authErrorMessage, type AuthUser } from "@/lib/auth/client";
import { isUserRole, roleHome } from "@/lib/auth/role-home";

export function LoginForm() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setIsPending(true);
    setFormError(null);

    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    let data: { user: NonNullable<AuthUser> } | null = null;
    let error: Awaited<ReturnType<typeof authClient.signInEmail>>["error"] = null;
    try {
      ({ data, error } = await authClient.signInEmail({ email, password }));
    } catch {
      // Network failure: no HTTP status at all.
      setFormError(authErrorMessage(null));
      setIsPending(false);
      return;
    }

    if (error) {
      // 401 → "Wrong email or password", 429 → "Too many attempts…",
      // everything else → generic (the real status is logged in dev only).
      setFormError(authErrorMessage(error));
      setIsPending(false);
      return;
    }

    // Session created. Redirect follows the role the SERVER knows —
    // nothing here is read from the URL or the browser.
    let user: AuthUser = data?.user ?? null;
    if (!isUserRole(user?.role)) {
      // Older session payloads may omit extended fields; ask the server.
      const { data: sessionData } = await authClient.getSession();
      user = sessionData?.user ?? null;
    }

    if (!isUserRole(user?.role)) {
      setFormError("Signed in, but your account has no working role yet. Please contact support.");
      setIsPending(false);
      return;
    }

    router.push(roleHome[user.role]);
    router.refresh();
  }

  return (
    <Card size="sm" className="gap-0 rounded-xl py-6">
      <CardContent className="flex flex-col gap-4">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit(new FormData(event.currentTarget));
          }}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-foreground">Email</label>
            <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-foreground">Password</label>
            <Input id="password" name="password" type="password" autoComplete="current-password" placeholder="Your password" required />
          </div>

          {formError && (
            <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
              {formError}
            </p>
          )}

          <Button type="submit" disabled={isPending}>
            {isPending ? "Logging in…" : "Log in"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          New to OjaLink?{" "}
          <Link href="/signup" className="font-medium text-primary rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            Create an account
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
