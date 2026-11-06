export const MAX_CART_ITEM_QUANTITY = 20;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type CartItemInput = {
  productId: string;
  quantity: number;
};

export type CartItemInputResult =
  | { success: true; data: CartItemInput }
  | { success: false; error: string };

export function validateCartItemInput(value: unknown): CartItemInputResult {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { success: false, error: "Choose a valid product and quantity." };
  }

  const input = value as Record<string, unknown>;
  const productId = input.productId;
  const quantity = input.quantity;

  if (typeof productId !== "string" || !UUID_PATTERN.test(productId)) {
    return { success: false, error: "Choose a valid product." };
  }
  if (
    typeof quantity !== "number" ||
    !Number.isInteger(quantity) ||
    quantity < 1 ||
    quantity > MAX_CART_ITEM_QUANTITY
  ) {
    return {
      success: false,
      error: `Choose a quantity from 1 to ${MAX_CART_ITEM_QUANTITY}.`,
    };
  }

  // Explicitly construct the accepted shape; untrusted extras such as price are discarded.
  return { success: true, data: { productId, quantity } };
}

export function validateProductId(value: unknown): string | null {
  return typeof value === "string" && UUID_PATTERN.test(value) ? value : null;
}
