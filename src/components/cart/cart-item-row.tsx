"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { removeCartItem, updateCartItem } from "@/app/cart/actions";
import { formatNaira } from "@/lib/orders/format";
import type { CartLine } from "@/lib/cart/queries";

export function CartItemRow({ item }: { item: CartLine }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  function updateQuantity(quantity: number) {
    setMessage("");
    startTransition(async () => {
      const result = await updateCartItem({ productId: item.productId, quantity });
      if (!result.success) setMessage(result.message);
    });
  }

  function remove() {
    setMessage("");
    startTransition(async () => {
      const result = await removeCartItem(item.productId);
      if (!result.success) setMessage(result.message);
    });
  }

  return (
    <Card className="rounded-xl">
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
        <div className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-lg bg-muted sm:w-28">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              sizes="(max-width: 640px) 96px, 112px"
              unoptimized
              className="object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-sm text-muted-foreground">
              No image
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <h2 className="font-heading text-lg font-bold text-foreground">{item.name}</h2>
          <p className="text-base text-muted-foreground">
            {formatNaira(item.unitPriceKobo)} each
          </p>
          {(!item.isAvailable || !item.isVendorApproved || item.stockQuantity === 0) && (
            <p className="text-sm text-destructive">This product is currently unavailable.</p>
          )}
          {item.isAvailable && item.isVendorApproved && item.stockQuantity < item.quantity && (
            <p className="text-sm text-destructive">Only {item.stockQuantity} in stock now.</p>
          )}
          {item.isAvailable && item.isVendorApproved && !item.canIncrease && item.stockQuantity >= item.quantity && (
            <p className="text-sm text-muted-foreground">Maximum available quantity reached.</p>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
          <div className="flex items-center gap-2" aria-label={`Quantity: ${item.quantity}`}>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-12"
              aria-label={`Decrease ${item.name} quantity`}
              disabled={pending || item.quantity <= 1}
              onClick={() => updateQuantity(item.quantity - 1)}
            >
              <Minus aria-hidden="true" />
            </Button>
            <span className="min-w-8 text-center text-base font-semibold" aria-live="polite">
              {item.quantity}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-12"
              aria-label={`Increase ${item.name} quantity`}
              disabled={pending || !item.canIncrease}
              onClick={() => updateQuantity(item.quantity + 1)}
            >
              <Plus aria-hidden="true" />
            </Button>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Line total</p>
            <p className="font-heading text-lg font-bold">{formatNaira(item.lineTotalKobo)}</p>
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-12 self-end text-destructive hover:text-destructive sm:self-center"
          aria-label={`Remove ${item.name} from cart`}
          disabled={pending}
          onClick={remove}
        >
          <Trash2 aria-hidden="true" />
        </Button>
      </CardContent>
      {message && (
        <p className="px-4 pb-4 text-sm text-destructive" aria-live="polite">
          {message}
        </p>
      )}
    </Card>
  );
}
