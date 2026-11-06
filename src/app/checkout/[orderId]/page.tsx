import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatNaira } from "@/lib/orders/format";
import { requireCartBuyer } from "@/lib/cart/access";
import { getBuyerCheckoutOrder } from "@/lib/checkout/queries";
import { PaystackPaymentButton } from "@/components/checkout/paystack-payment-button";

export const instant = false;

export const metadata: Metadata = {
  title: "Review your order | OjaLink",
  description: "Review your OjaLink order total and complete test payment.",
};

export default async function CheckoutOrderPage({
  params,
  searchParams,
}: PageProps<"/checkout/[orderId]">) {
  const buyer = await requireCartBuyer();
  const { orderId } = await params;
  const { payment_error: paymentError } = await searchParams;
  const order = await getBuyerCheckoutOrder(buyer.id, orderId);
  if (!order) notFound();
  const reservationExpired = order.reservationExpired;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10">
      <header>
        <h1 className="font-heading text-2xl font-bold sm:text-3xl">Review your order</h1>
        <p className="mt-2 text-base text-muted-foreground">From {order.shopName}</p>
      </header>
      <Card className="rounded-xl"><CardContent className="space-y-4 p-5">
        <h2 className="font-heading text-xl font-bold">Items</h2>
        {order.items.map((item, index) => (
          <div key={index} className="flex justify-between gap-4 text-base">
            <span>{item.name} × {item.quantity}</span>
            <span>{formatNaira(item.unitPriceKobo * item.quantity)}</span>
          </div>
        ))}
        <div className="space-y-2 border-t pt-4">
          <Total label="Subtotal" amount={order.subtotalKobo} />
          <Total label="Delivery" amount={order.deliveryFeeKobo} />
          <Total label="Platform fee" amount={order.platformFeeKobo} />
          <Total label="Total" amount={order.totalKobo} strong />
        </div>
        <div className="border-t pt-4">
          <h3 className="font-semibold">Deliver to</h3>
          <p className="text-base">{order.deliveryAddress}</p>
          <p className="text-base text-muted-foreground">{order.deliveryArea}, Benin City</p>
        </div>
        {order.status === "paid" ? (
          <div role="status" className="rounded-lg border p-4 text-base">Payment confirmed. Your order is being prepared.</div>
        ) : order.status === "rejected" ? (
          <div role="alert" className="rounded-lg border border-destructive p-4 text-base text-destructive">
            This order could not be completed. If your payment went through, contact OjaLink support about a refund.
          </div>
        ) : reservationExpired || order.status === "cancelled" ? (
          <div role="alert" className="rounded-lg border border-destructive p-4 text-base text-destructive">
            Your 15-minute stock hold expired. Return to the marketplace and add the items again.
            <Button asChild variant="outline" className="mt-3 h-12 w-full">
              <Link href="/marketplace">Browse the marketplace</Link>
            </Button>
          </div>
        ) : (
          <>
            {paymentError && (
              <p role="alert" className="rounded-lg border border-destructive p-3 text-sm text-destructive">
                {paymentError === "setup"
                  ? "Payment setup is incomplete on this server."
                  : paymentError === "expired"
                    ? "Your stock hold expired. Place a new order to reserve the items again."
                    : "We couldn't start the payment. Please try again."}
              </p>
            )}
            <p className="text-sm text-muted-foreground">Payment is confirmed by Paystack. Do not close this page until you return from checkout.</p>
            <PaystackPaymentButton orderId={order.id} />
          </>
        )}
      </CardContent></Card>
      <Button asChild variant="outline" className="h-12 w-full sm:w-auto"><Link href="/orders">View my orders</Link></Button>
    </main>
  );
}

function Total({ label, amount, strong = false }: { label: string; amount: number; strong?: boolean }) {
  return <div className={"flex justify-between gap-4 " + (strong ? "font-heading text-lg font-bold" : "text-base")}>
    <span>{label}</span><span>{formatNaira(amount)}</span>
  </div>;
}
