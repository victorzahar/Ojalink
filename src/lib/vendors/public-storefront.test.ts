import { describe, expect, it } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";

import {
  approvedVendorSlugScope,
  deliveredVendorReviewsScope,
  isValidPublicVendorSlug,
  projectPublicVendorStorefront,
  publicVendorProductsScope,
} from "@/lib/vendors/public-storefront-scopes";

const dialect = new PgDialect();

describe("public vendor storefront scopes", () => {
  it("requires the matching vendor slug and approved status", () => {
    const query = dialect.sqlToQuery(approvedVendorSlugScope("adaeze-fabrics")!);

    expect(query.sql).toContain('"vendors"."slug" = $1');
    expect(query.sql).toContain('"vendors"."approval_status" = $2');
    expect(query.params).toEqual(["adaeze-fabrics", "approved"]);
  });

  it("rejects malformed or missing vendor slugs before querying", () => {
    expect(isValidPublicVendorSlug("")).toBe(false);
    expect(isValidPublicVendorSlug("not a slug")).toBe(false);
    expect(isValidPublicVendorSlug("adaeze-fabrics")).toBe(true);
  });

  it("limits products to the requested vendor and available listings", () => {
    const query = dialect.sqlToQuery(publicVendorProductsScope("vendor-id")!);

    expect(query.sql).toContain('"products"."vendor_id" = $1');
    expect(query.sql).toContain('"products"."is_available" = $2');
    expect(query.params).toEqual(["vendor-id", true]);
  });

  it("only exposes reviews attached to delivered orders", () => {
    const query = dialect.sqlToQuery(deliveredVendorReviewsScope("vendor-id")!);

    expect(query.sql).toContain('"reviews"."vendor_id" = $1');
    expect(query.sql).toContain('"orders"."status" = $2');
    expect(query.params).toEqual(["vendor-id", "delivered"]);
  });

  it("projects only public vendor, product, and review fields", () => {
    const createdAt = new Date("2026-10-30T12:00:00.000Z");
    const result = projectPublicVendorStorefront(
      {
        id: "vendor-id",
        userId: "private-user-id",
        email: "private@example.test",
        payoutAccount: "private-account",
        slug: "adaeze-fabrics",
        shopName: "Adaeze Fabrics",
        description: "Fabrics from Oba Market.",
        marketName: "Oba Market",
        marketArea: "Ring Road",
      },
      [
        {
          vendorId: "vendor-id",
          stockQuantity: 24,
          slug: "ankara-fabric",
          name: "Ankara fabric",
          description: null,
          categoryName: "Fabrics",
          priceKobo: 650000,
          inStock: true,
          imageUrl: "https://unapproved.example/image.webp",
        },
      ],
      [
        {
          buyerId: "private-buyer-id",
          orderId: "private-order-id",
          rating: 5,
          comment: "Good fabric.",
          createdAt,
        },
      ],
    );

    expect(result.vendor).not.toHaveProperty("id");
    expect(result.vendor).not.toHaveProperty("userId");
    expect(result.vendor).not.toHaveProperty("email");
    expect(result.vendor).not.toHaveProperty("payoutAccount");
    expect(result.products[0]).not.toHaveProperty("vendorId");
    expect(result.products[0]).not.toHaveProperty("stockQuantity");
    expect(result.products[0].imageUrl).toBeNull();
    expect(result.reviews[0]).not.toHaveProperty("buyerId");
    expect(result.reviews[0]).not.toHaveProperty("orderId");
  });
});
