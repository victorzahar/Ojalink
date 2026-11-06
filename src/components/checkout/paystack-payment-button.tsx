import { Button } from "@/components/ui/button";
import { initiatePaystackPayment } from "@/app/checkout/[orderId]/actions";

export function PaystackPaymentButton({ orderId }: { orderId: string }) {
  return (
    <form action={initiatePaystackPayment}>
      <input type="hidden" name="orderId" value={orderId} />
      <Button type="submit" className="h-12 w-full">Pay securely with Paystack</Button>
    </form>
  );
}
