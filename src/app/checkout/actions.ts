"use server";

import { revalidatePath } from "next/cache";

import { requireCartBuyer } from "@/lib/cart/access";
import { createCheckoutOrder } from "@/lib/checkout/queries";
import { validateCheckoutAddress } from "@/lib/checkout/validation";

export async function submitCheckout(input: unknown) {
  const buyer = await requireCartBuyer();
  const parsed = validateCheckoutAddress(input);
  if (!parsed.success) return { success: false as const, message: parsed.error };

  try {
    const result = await createCheckoutOrder(
      buyer.id,
      parsed.data.deliveryAddress,
      parsed.data.deliveryArea,
    );
    if (!result.success) return result;
    revalidatePath("/cart");
    revalidatePath("/orders");
    return result;
  } catch {
    return { success: false as const, message: "We couldn't place your order. Please try again." };
  }
}
