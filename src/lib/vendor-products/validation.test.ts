import { describe, expect, it } from "vitest";

import { canManageVendorProducts, formatKoboAsNaira, nairaToKobo, validateProductForm } from "./validation";

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

describe("vendor product rules", () => {
  it("converts Naira to integer kobo and back", () => {
    expect(nairaToKobo("6,500")).toBe(650000);
    expect(nairaToKobo("3500.50")).toBe(350050);
    expect(formatKoboAsNaira(650000)).toBe("6500.00");
    expect(nairaToKobo("1.999")).toBeNull();
  });

  it("requires a name, category, valid price and whole non-negative stock", () => {
    const valid = validateProductForm(form({ name: " Ankara ", categoryId: "c1", priceNaira: "6500", stockQuantity: "4", isAvailable: "on" }));
    expect(valid).toMatchObject({ success: true, data: { name: "Ankara", priceKobo: 650000, stockQuantity: 4, isAvailable: true } });
    expect(validateProductForm(form({ name: "", categoryId: "c1", priceNaira: "10", stockQuantity: "1" })).success).toBe(false);
    expect(validateProductForm(form({ name: "Rice", categoryId: "c1", priceNaira: "10", stockQuantity: "-1" })).success).toBe(false);
    expect(validateProductForm(form({ name: "Rice", categoryId: "c1", priceNaira: "10", stockQuantity: "1.5" })).success).toBe(false);
  });

  it("forces zero-stock products unavailable and does not auto-enable on restock", () => {
    const soldOut = validateProductForm(form({ name: "Rice", categoryId: "c1", priceNaira: "10", stockQuantity: "0", isAvailable: "on" }));
    expect(soldOut).toMatchObject({ success: true, data: { isAvailable: false } });
    const restockedButUnchecked = validateProductForm(form({ name: "Rice", categoryId: "c1", priceNaira: "10", stockQuantity: "3" }));
    expect(restockedButUnchecked).toMatchObject({ success: true, data: { stockQuantity: 3, isAvailable: false } });
  });

  it("allows vendors only, not admins or other roles", () => {
    expect(canManageVendorProducts("vendor")).toBe(true);
    expect(canManageVendorProducts("admin")).toBe(false);
    expect(canManageVendorProducts("buyer")).toBe(false);
    expect(canManageVendorProducts(undefined)).toBe(false);
  });
});
