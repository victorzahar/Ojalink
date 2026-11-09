export const DELIVERY_AREAS = [
  "Ugbowo", "Uselu", "Ring Road", "Sapele Road", "GRA", "New Benin", "Oba Market", "Ikpoba Hill",
] as const;

export type CheckoutAddress = {
  deliveryAddress: string;
  deliveryArea: (typeof DELIVERY_AREAS)[number];
};

export function validateCheckoutAddress(input: unknown):
  | { success: true; data: CheckoutAddress }
  | { success: false; error: string } {
  if (!input || typeof input !== "object") return { success: false, error: "Enter your delivery details." };
  const value = input as Record<string, unknown>;
  const deliveryAddress = typeof value.deliveryAddress === "string" ? value.deliveryAddress.trim() : "";
  const deliveryArea = typeof value.deliveryArea === "string" ? value.deliveryArea.trim() : "";
  if (deliveryAddress.length < 8 || deliveryAddress.length > 250) {
    return { success: false, error: "Enter a delivery address between 8 and 250 characters." };
  }
  if (!(DELIVERY_AREAS as readonly string[]).includes(deliveryArea)) {
    return { success: false, error: "Choose a listed Benin City delivery area." };
  }
  return { success: true, data: { deliveryAddress, deliveryArea: deliveryArea as CheckoutAddress["deliveryArea"] } };
}
