"use client";

import { useState, useTransition } from "react";
import { acceptOrder, rejectOrder } from "@/app/vendor/orders/actions";

type Result = { ok: true; message?: string } | { ok: false; message: string };

export function OrderActions({ orderId }: { orderId: string }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function run(action: (id: string) => Promise<Result>) {
    startTransition(async () => {
      const result = await action(orderId);
      setMessage(result.message ?? (result.ok ? "Order updated." : null));
    });
  }

  return (
    <div className="mt-1 flex flex-col gap-2">
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => run(acceptOrder)}
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          Accept
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => run(rejectOrder)}
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground disabled:opacity-50"
        >
          Reject
        </button>
      </div>
      {message && (
        <p role="status" className="text-sm text-muted-foreground">
          {message}
        </p>
      )}
    </div>
  );
}
