"use server";

import { revalidatePath } from "next/cache";

import { requireCartBuyer } from "@/lib/cart/access";
import {
  addCartItemForBuyer,
  removeCartItemForBuyer,
  setCartItemQuantityForBuyer,
  type CartMutationResult,
} from "@/lib/cart/queries";
import { validateCartItemInput, validateProductId } from "@/lib/cart/validation";

const INVALID_INPUT: CartMutationResult = {
  success: false,
  message: "Choose a valid product and quantity.",
};

export async function addCartItem(input: unknown): Promise<CartMutationResult> {
  const buyer = await requireCartBuyer();
  const parsed = validateCartItemInput(input);
  if (!parsed.success) return { success: false, message: parsed.error };

  try {
    const result = await addCartItemForBuyer(
      buyer.id,
      parsed.data.productId,
      parsed.data.quantity,
    );
    if (result.success) revalidatePath("/cart");
    return result;
  } catch {
    return {
      success: false,
      message: "We couldn’t update your cart. Please try again.",
    };
  }
}

export async function updateCartItem(input: unknown): Promise<CartMutationResult> {
  const buyer = await requireCartBuyer();
  const parsed = validateCartItemInput(input);
  if (!parsed.success) return { success: false, message: parsed.error };

  try {
    const result = await setCartItemQuantityForBuyer(
      buyer.id,
      parsed.data.productId,
      parsed.data.quantity,
    );
    if (result.success) revalidatePath("/cart");
    return result;
  } catch {
    return {
      success: false,
      message: "We couldn’t update your cart. Please try again.",
    };
  }
}

export async function removeCartItem(productIdInput: unknown): Promise<CartMutationResult> {
  const buyer = await requireCartBuyer();
  const productId = validateProductId(productIdInput);
  if (!productId) return INVALID_INPUT;

  try {
    const result = await removeCartItemForBuyer(buyer.id, productId);
    if (result.success) revalidatePath("/cart");
    return result;
  } catch {
    return {
      success: false,
      message: "We couldn’t remove that item. Please try again.",
    };
  }
}
