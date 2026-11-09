"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { addCartItem } from "@/app/cart/actions";

export function AddToCartButton({
  productId,
  disabled = false,
}: {
  productId: string;
  disabled?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  function handleAdd() {
    setMessage("");
    startTransition(async () => {
      const result = await addCartItem({ productId, quantity: 1 });
      setMessage(result.message);
    });
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        className="h-12 w-full"
        disabled={pending || disabled}
        onClick={handleAdd}
        aria-busy={pending}
      >
        {disabled ? "Out of stock" : pending ? "Adding…" : "Add to cart"}
      </Button>
      <p aria-live="polite" className="min-h-5 text-sm text-muted-foreground">
        {message}
      </p>
    </div>
  );
}
