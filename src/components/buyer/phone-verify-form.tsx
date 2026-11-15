"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { confirmPhoneOtp, requestPhoneOtp } from "@/app/buyer/verify/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const inputClassName =
  "h-11 rounded-md border border-input bg-background px-3 text-base text-foreground";

export function PhoneVerifyForm({
  defaultPhone,
  maxAttempts,
}: {
  defaultPhone: string;
  maxAttempts: number;
}) {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState(defaultPhone);
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [sentMessage, setSentMessage] = useState<string | null>(null);

  async function handleRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);

    const result = await requestPhoneOtp({ phone });

    if (result.ok) {
      setSentMessage(result.message);
      setDemoCode(result.demoCode ?? null);
      setStep("code");
      router.refresh();
    } else {
      setError(result.message);
    }
    setSubmitting(false);
  }

  async function handleConfirm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);

    const result = await confirmPhoneOtp({ code });

    if (result.ok) {
      setSentMessage(result.message);
      router.refresh();
    } else {
      setError(result.message);
    }
    setSubmitting(false);
  }

  return (
    <Card>
      <CardContent>
        {step === "phone" ? (
          <form onSubmit={handleRequest} className="flex flex-col gap-4">
            <div className="grid gap-1.5">
              <label htmlFor="phone" className="text-sm font-medium text-foreground">
                Phone number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className={inputClassName}
                placeholder="e.g. 0801 234 5678"
                aria-describedby="phone-hint"
              />
              <p id="phone-hint" className="text-xs text-muted-foreground">
                We send a 6-digit code to this number. It also appears on your order for the rider.
              </p>
            </div>

            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Sending code…" : "Send code"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleConfirm} className="flex flex-col gap-4">
            <CardHeader className="p-0">
              <CardTitle className="text-base">Enter your code</CardTitle>
              <CardDescription>{sentMessage}</CardDescription>
            </CardHeader>

            {demoCode && (
              <p className="rounded-md bg-amber-100 px-3 py-2 text-sm text-amber-900">
                Demo mode (no SMS provider configured): your code is{" "}
                <span className="font-bold tracking-widest">{demoCode}</span>
              </p>
            )}

            <div className="grid gap-1.5">
              <label htmlFor="code" className="text-sm font-medium text-foreground">
                6-digit code
              </label>
              <input
                id="code"
                name="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                maxLength={6}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/[^0-9]/g, ""))}
                className={`${inputClassName} text-center text-xl tracking-[0.5em]`}
                placeholder="000000"
                aria-describedby="code-hint"
              />
              <p id="code-hint" className="text-xs text-muted-foreground">
                The code expires in 10 minutes. You have {maxAttempts} attempts before you must
                request a new one.
              </p>
            </div>

            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Checking…" : "Verify phone"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                setStep("phone");
                setError(null);
                setCode("");
              }}
            >
              Use a different number
            </Button>
            <Button asChild variant="ghost" className="w-full">
              <Link href="/buyer">Back to buyer area</Link>
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
