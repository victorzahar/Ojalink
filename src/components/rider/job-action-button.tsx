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

const runAction: Record<JobAction, (deliveryId: string) => Promise<RiderActionResult>> = {
  accept: acceptJob,
  picked_up: markPickedUp,
  delivered: markDelivered,
};

type JobActionButtonProps = {
  deliveryId: string;
  action: JobAction;
  label: string;
};

export function JobActionButton({ deliveryId, action, label }: JobActionButtonProps) {
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function handleClick() {
    // Stop double taps: the button is disabled while we wait for the server.
    if (isPending) return;

    setIsPending(true);
    setMessage(null);

    try {
      const result = await runAction[action](deliveryId);
      setMessage({ ok: result.ok, text: result.message });
    } catch {
      setMessage({ ok: false, text: "Something went wrong. Please try again." });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="flex w-full flex-col gap-2">
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
