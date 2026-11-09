import { describe, expect, it } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";

import { cartBelongsToBuyer, buyerCartScope } from "@/lib/cart/ownership";
import {
  getCartAddError,
  getCartLineAmounts,
  vendorAfterItemRemoval,
} from "@/lib/cart/policy";
import { validateCartItemInput } from "@/lib/cart/validation";

const vendorA = "11111111-1111-4111-8111-111111111111";
const vendorB = "22222222-2222-4222-8222-222222222222";
const productId = "33333333-3333-4333-8333-333333333333";

describe("cart input and buyer ownership", () => {
  it("accepts only product id and quantity, ignoring a browser-supplied price", () => {
    const parsed = validateCartItemInput({
      productId,
      quantity: 2,
      priceKobo: 1,
      lineTotalKobo: 2,
    });

    expect(parsed).toEqual({
      success: true,
      data: { productId, quantity: 2 },
    });
  });

  it("rejects a buyer trying to use another buyer's cart scope", () => {
    const condition = buyerCartScope("buyer-a", "cart-b");
    const compiled = new PgDialect().sqlToQuery(condition!);

    expect(compiled.sql).toContain('"carts"."buyer_id" = $1');
    expect(compiled.sql).toContain('"carts"."id" = $2');
    expect(compiled.params).toEqual(["buyer-a", "cart-b"]);
    expect(cartBelongsToBuyer("buyer-b", "buyer-a")).toBe(false);
  });
});

describe("cart add rules", () => {
  const eligible = {
    cartVendorId: null,
    productVendorId: vendorA,
    vendorApprovalStatus: "approved",
    isAvailable: true,
    stockQuantity: 8,
    currentQuantity: 0,
    quantityToAdd: 1,
  };

  it("rejects an item from a different vendor while retaining one-vendor carts", () => {
    expect(
      getCartAddError({ ...eligible, cartVendorId: vendorA, productVendorId: vendorB }),
    ).toMatch(/another shop/i);
  });

  it("clears the cart vendor when its last item is removed", () => {
    expect(vendorAfterItemRemoval(vendorA, 0)).toBeNull();
    expect(vendorAfterItemRemoval(vendorA, 1)).toBe(vendorA);
  });

  it("rejects unapproved, unavailable and out-of-stock products", () => {
    expect(getCartAddError({ ...eligible, vendorApprovalStatus: "pending" })).toMatch(/not approved/i);
    expect(getCartAddError({ ...eligible, isAvailable: false })).toMatch(/unavailable/i);
    expect(getCartAddError({ ...eligible, stockQuantity: 0 })).toMatch(/unavailable/i);
  });

  it("caps a line at 20 and at available stock", () => {
    expect(getCartAddError({ ...eligible, stockQuantity: 30, currentQuantity: 20, quantityToAdd: 1 })).toMatch(/up to 20/i);
    expect(getCartAddError({ ...eligible, stockQuantity: 3, currentQuantity: 3, quantityToAdd: 1 })).toMatch(/up to 3/i);
  });

  it("calculates line totals from the database product price", () => {
    const parsed = validateCartItemInput({ productId, quantity: 2, priceKobo: 1 });
    if (!parsed.success) throw new Error("Expected valid cart input");

    const productReadFromDatabase = { priceKobo: 42500 };
    expect(getCartLineAmounts(productReadFromDatabase.priceKobo, parsed.data.quantity)).toEqual({
      unitPriceKobo: 42500,
      lineTotalKobo: 85000,
    });
  });
});
