export type ProductInput = {
  name: string;
  description: string;
  categoryId: string;
  priceKobo: number;
  stockQuantity: number;
  isAvailable: boolean;
};

export type ValidationResult =
  | { success: true; data: ProductInput }
  | { success: false; error: string };

export function nairaToKobo(value: string): number | null {
  const normalized = value.trim().replaceAll(",", "");
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
  const [naira, kobo = ""] = normalized.split(".");
  const amount = Number(naira) * 100 + Number(kobo.padEnd(2, "0"));
  return Number.isSafeInteger(amount) ? amount : null;
}

export function validateProductForm(formData: FormData): ValidationResult {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "");
  const priceKobo = nairaToKobo(String(formData.get("priceNaira") ?? ""));
  const stockText = String(formData.get("stockQuantity") ?? "").trim();
  const stockQuantity = /^\d+$/.test(stockText) ? Number(stockText) : NaN;

  if (!name || name.length > 120) {
    return { success: false, error: "Enter a product name (up to 120 characters)." };
  }
  if (!categoryId) return { success: false, error: "Choose a category." };
  if (priceKobo === null) {
    return { success: false, error: "Enter a valid Naira price, with up to two decimal places." };
  }
  if (!Number.isSafeInteger(stockQuantity) || stockQuantity < 0) {
    return { success: false, error: "Stock must be a whole number of zero or more." };
  }

  return {
    success: true,
    data: {
      name,
      description,
      categoryId,
      priceKobo,
      stockQuantity,
      // Empty stock always makes the item unavailable. Restocking never opts it back in.
      isAvailable: stockQuantity > 0 && formData.get("isAvailable") === "on",
    },
  };
}

export function formatKoboAsNaira(priceKobo: number): string {
  return (priceKobo / 100).toFixed(2);
}

export function canManageVendorProducts(role: string | null | undefined): boolean {
  return role === "vendor";
}
