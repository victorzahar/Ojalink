import { MAX_CART_ITEM_QUANTITY } from "@/lib/cart/validation";

export type CartAddPolicyInput = {
  cartVendorId: string | null;
  productVendorId: string;
  vendorApprovalStatus: string;
  isAvailable: boolean;
  stockQuantity: number;
  currentQuantity: number;
  quantityToAdd: number;
};

export function getCartAddError(input: CartAddPolicyInput): string | null {
  if (input.vendorApprovalStatus !== "approved") {
    return "This shop is not approved to sell yet.";
  }
  if (!input.isAvailable || input.stockQuantity < 1) {
    return "This product is currently unavailable.";
  }
  if (
    input.cartVendorId !== null &&
    input.cartVendorId !== input.productVendorId
  ) {
    return "Your cart has items from another shop. Remove them before adding this product.";
  }

  const limit = Math.min(MAX_CART_ITEM_QUANTITY, input.stockQuantity);
  if (input.currentQuantity + input.quantityToAdd > limit) {
    return `You can add up to ${limit} of this product based on available stock.`;
  }

  return null;
}

export function getCartLineAmounts(priceKobo: number, quantity: number) {
  return {
    unitPriceKobo: priceKobo,
    lineTotalKobo: priceKobo * quantity,
  };
}

export function vendorAfterItemRemoval(
  cartVendorId: string | null,
  remainingItemCount: number,
) {
  return remainingItemCount === 0 ? null : cartVendorId;
}
