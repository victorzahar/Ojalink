"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { verifyPayoutAccount } from "@/app/vendor/payouts/actions";
import { Button } from "@/components/ui/button";

const inputClassName =
  "h-11 rounded-md border border-input bg-background px-3 text-base text-foreground";

/**
 * Launch bank list (Paystack bank codes). Kept static on purpose: the resolver
 * endpoint needs a bank code, and a small verified list beats a live directory
 * call for a demo-scale launch.
 */
export const NIGERIAN_BANKS = [
  { name: "Access Bank", code: "044" },
  { name: "Citibank", code: "023" },
  { name: "Ecobank", code: "050" },
  { name: "FairMoney MFB", code: "401" },
  { name: "FCMB", code: "214" },
  { name: "Fidelity Bank", code: "191" },
  { name: "First Bank of Nigeria", code: "011" },
  { name: "GTBank", code: "058" },
  { name: "Jaiz Bank", code: "301" },
  { name: "Keystone Bank", code: "082" },
  { name: "Kuda MFB", code: "50211" },
  { name: "Moniepoint MFB", code: "50515" },
  { name: "Opay", code: "999992" },
  { name: "PalmPay", code: "999991" },
  { name: "Polaris Bank", code: "076" },
  { name: "Providus Bank", code: "101" },
  { name: "Stanbic IBTC", code: "221" },
  { name: "Standard Chartered", code: "068" },
  { name: "Sterling Bank", code: "232" },
  { name: "UBA", code: "033" },
  { name: "Union Bank", code: "032" },
  { name: "Unity Bank", code: "215" },
  { name: "Wema Bank", code: "035" },
  { name: "Zenith Bank", code: "057" },
] as const;

export function BankVerifyForm({ profileName }: { profileName: string }) {
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

    const formData = new FormData(form);
    const result = await verifyPayoutAccount({
      bankCode: String(formData.get("bankCode") ?? ""),
      accountNumber: String(formData.get("accountNumber") ?? ""),
    });

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
      <p className="rounded-md bg-green-100 px-3 py-2 text-sm font-medium text-green-900" role="status">
        {success}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid gap-1.5">
        <label htmlFor="bankCode" className="text-sm font-medium text-foreground">
          Bank
        </label>
        <select id="bankCode" name="bankCode" required className={inputClassName} defaultValue="">
          <option value="" disabled>
            Choose your bank
          </option>
          {NIGERIAN_BANKS.map((bank) => (
            <option key={bank.code} value={bank.code}>
              {bank.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="accountNumber" className="text-sm font-medium text-foreground">
          Account number
        </label>
        <input
          id="accountNumber"
          name="accountNumber"
          type="text"
          inputMode="numeric"
          required
          pattern="[0-9]{10}"
          maxLength={10}
          className={`${inputClassName} tracking-widest`}
          placeholder="10 digits"
          aria-describedby="accountNumber-hint"
        />
        <p id="accountNumber-hint" className="text-xs text-muted-foreground">
          We send it to Paystack to confirm the account holder is {profileName}. The number itself
          is never stored on our servers.
        </p>
      </div>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "Checking account…" : "Verify payout account"}
      </Button>
    </form>
  );
}
