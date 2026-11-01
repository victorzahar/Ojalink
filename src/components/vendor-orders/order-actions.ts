// src/components/vendor-orders/order-actions.tsx
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
    <div>
      <button type="button" disabled={pending} onClick={() => run(acceptOrder)}>
        Accept
      </button>{" "}
      <button type="button" disabled={pending} onClick={() => run(rejectOrder)}>
        Reject
      </button>
      {message && <p role="status">{message}</p>}
    </div>
  );
}
