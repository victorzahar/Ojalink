"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatNaira } from "@/lib/orders/format";
import { DELIVERY_AREAS } from "@/lib/checkout/validation";
import { DELIVERY_FEE_KOBO, PLATFORM_FEE_KOBO } from "@/lib/checkout/pricing";
import type { BuyerCart } from "@/lib/cart/queries";
import { submitCheckout } from "@/app/checkout/actions";

export function CheckoutForm({ cart }: { cart: BuyerCart }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const router = useRouter();
  const canCheckout = cart.items.length > 0 && cart.items.every((item) =>
    item.isAvailable && item.isVendorApproved && item.quantity <= item.stockQuantity
  );

  function submit(formData: FormData) {
    setMessage("");
    const input = {
      deliveryAddress: formData.get("deliveryAddress"),
      deliveryArea: formData.get("deliveryArea"),
    };
    startTransition(async () => {
      const result = await submitCheckout(input);
      if (!result.success) {
        setMessage(result.message);
        return;
      }
      router.push("/checkout/" + result.orderId);
    });
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <Card className="rounded-xl">
        <CardContent className="p-5">
          <form action={submit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="deliveryArea" className="text-base font-semibold">Delivery area</label>
              <select id="deliveryArea" name="deliveryArea" required className="h-12 w-full rounded-lg border border-input bg-background px-3 text-base">
                <option value="">Choose your area</option>
                {DELIVERY_AREAS.map((area) => <option key={area} value={area}>{area}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="deliveryAddress" className="text-base font-semibold">Street address and delivery details</label>
              <textarea id="deliveryAddress" name="deliveryAddress" required minLength={8} maxLength={250} rows={4} className="w-full rounded-lg border border-input bg-background p-3 text-base" placeholder="House number, street, landmark" />
            </div>
            {message && <p role="alert" className="text-sm text-destructive">{message}</p>}
            <Button type="submit" disabled={pending || !canCheckout} className="h-12 w-full">
              {pending ? "Preparing your order…" : "Review order"}
            </Button>
            {!canCheckout && <p className="text-sm text-destructive">Update unavailable or low-stock items in your cart before checkout.</p>}
          </form>
        </CardContent>
      </Card>

      <Card className="h-fit rounded-xl">
        <CardContent className="space-y-4 p-5">
          <h2 className="font-heading text-xl font-bold">Order summary</h2>
          <p className="text-sm text-muted-foreground">From {cart.vendorName ?? "your shop"}</p>
          {cart.items.map((item) => (
            <div key={item.productId} className="flex justify-between gap-4 text-sm">
              <span>{item.name} × {item.quantity}</span>
              <span className="font-medium">{formatNaira(item.lineTotalKobo)}</span>
            </div>
          ))}
          <div className="flex justify-between gap-4 border-t pt-3 text-base"><span>Subtotal</span><span>{formatNaira(cart.subtotalKobo)}</span></div>
          <div className="flex justify-between gap-4 text-sm"><span>Delivery</span><span>{formatNaira(DELIVERY_FEE_KOBO)}</span></div>
          <div className="flex justify-between gap-4 text-sm"><span>Platform fee</span><span>{formatNaira(PLATFORM_FEE_KOBO)}</span></div>
          <div className="flex justify-between gap-4 border-t pt-3 font-heading text-lg font-bold"><span>Total</span><span>{formatNaira(cart.subtotalKobo + DELIVERY_FEE_KOBO + PLATFORM_FEE_KOBO)}</span></div>
        </CardContent>
      </Card>
    </div>
  );
}
