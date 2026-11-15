"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  acceptJob,
  markDelivered,
  markPickedUp,
  type RiderActionResult,
} from "@/lib/rider/actions";
import { riderPageCopy } from "@/lib/rider/page-copy";

type JobAction = "accept" | "picked_up" | "delivered";

const runAction: Record<JobAction, (deliveryId: string, handoverCode?: string) => Promise<RiderActionResult>> = {
  accept: (deliveryId) => acceptJob(deliveryId),
  picked_up: (deliveryId) => markPickedUp(deliveryId),
  delivered: (deliveryId, handoverCode) => markDelivered(deliveryId, handoverCode),
};

type JobActionButtonProps = {
  deliveryId: string;
  action: JobAction;
  label: string;
  /** When true, a 4-digit buyer handover code input is shown above the button. */
  handoverCodeInput?: boolean;
};

export function JobActionButton({ deliveryId, action, label, handoverCodeInput = false }: JobActionButtonProps) {
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [handoverCode, setHandoverCode] = useState("");

  async function handleClick() {
    // Stop double taps: the button is disabled while we wait for the server.
    if (isPending) return;

    setIsPending(true);
    setMessage(null);

    try {
      const result = await runAction[action](deliveryId, handoverCodeInput ? handoverCode.trim() : undefined);
      setMessage({ ok: result.ok, text: result.message });
      if (result.ok) setHandoverCode("");
    } catch {
      setMessage({ ok: false, text: "Something went wrong. Please try again." });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="flex w-full flex-col gap-2">
      {handoverCodeInput && (
        <div className="grid gap-1.5">
          <label htmlFor={`handover-${deliveryId}`} className="text-sm font-medium text-foreground">
            Buyer handover code
          </label>
          <input
            id={`handover-${deliveryId}`}
            name="handoverCode"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={4}
            value={handoverCode}
            onChange={(event) => setHandoverCode(event.target.value.replace(/[^0-9]/g, ""))}
            className="h-12 rounded-md border border-input bg-background px-3 text-lg tracking-[0.4em] text-foreground"
            placeholder="0000"
          />
          <p className="text-xs text-muted-foreground">
            The buyer shows you this code when you hand over the goods. You cannot close the delivery without it.
          </p>
        </div>
      )}
      <Button type="button" onClick={handleClick} disabled={isPending} className="w-full">
        {isPending ? riderPageCopy.pendingLabel : label}
      </Button>
      {/* Screen readers announce the result when it appears. */}
      <p
        role="status"
        aria-live="polite"
        className={
          message
            ? message.ok
              ? "text-base font-medium text-primary"
              : "text-base font-medium text-destructive"
            : "sr-only"
        }
      >
        {message?.text}
      </p>
    </div>
  );
}
