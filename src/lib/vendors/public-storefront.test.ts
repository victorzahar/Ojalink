import { describe, expect, it } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";

import {
  approvedVendorsScope,
  approvedVendorSlugScope,
  deliveredVendorReviewsScope,
  deliveredVendorsReviewsScope,
  isValidPublicVendorSlug,
  projectPublicVendorList,
  projectPublicVendorStorefront,
  publicVendorProductsScope,
} from "@/lib/vendors/public-storefront-scopes";

const dialect = new PgDialect();

describe("public vendor storefront scopes", () => {
  it("limits the public vendor directory to approved vendors", () => {
    const query = dialect.sqlToQuery(approvedVendorsScope());

    expect(query.sql).toContain('"vendors"."approval_status" = $1');
    expect(query.params).toEqual(["approved"]);
  });

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

  it("limits products to the requested vendor and keeps unavailable items for the out-of-stock state", () => {
    const query = dialect.sqlToQuery(publicVendorProductsScope("vendor-id")!);

    expect(query.sql).toContain('"products"."vendor_id" = $1');
    expect(query.sql).not.toContain('"products"."is_available"');
    expect(query.params).toEqual(["vendor-id"]);
  });

  it("only exposes reviews attached to delivered orders", () => {
    const query = dialect.sqlToQuery(deliveredVendorReviewsScope("vendor-id")!);

    expect(query.sql).toContain('"reviews"."vendor_id" = $1');
    expect(query.sql).toContain('"reviews"."vendor_id" = "orders"."vendor_id"');
    expect(query.sql).toContain('"orders"."status" = $2');
    expect(query.params).toEqual(["vendor-id", "delivered"]);
  });

  it("limits directory ratings to delivered reviews for approved vendors", () => {
    const query = dialect.sqlToQuery(deliveredVendorsReviewsScope(["vendor-a", "vendor-b"])!);

    expect(query.sql).toContain('"reviews"."vendor_id" in ($1, $2)');
    expect(query.sql).toContain('"reviews"."vendor_id" = "orders"."vendor_id"');
    expect(query.sql).toContain('"orders"."status" = $3');
    expect(query.params).toEqual(["vendor-a", "vendor-b", "delivered"]);
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
        approvalStatus: "approved",
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
          isAvailable: true,
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
    expect(result.vendor.isVerified).toBe(true);
    expect(result.products[0]).not.toHaveProperty("vendorId");
    expect(result.products[0]).not.toHaveProperty("stockQuantity");
    expect(result.products[0].inStock).toBe(true);
    expect(result.products[0].imageUrl).toBeNull();
    expect(result.reviews[0]).not.toHaveProperty("buyerId");
    expect(result.reviews[0]).not.toHaveProperty("orderId");
  });

  it("projects public vendor cards with delivered-review averages and up to three local thumbnails", () => {
    const result = projectPublicVendorList(
      [
        {
          id: "vendor-a",
          userId: "private-user-id",
          email: "private@example.test",
          payoutAccount: "private-account",
          slug: "adaeze-fabrics",
          shopName: "Adaeze Fabrics",
          marketName: "New Benin Market",
          marketArea: "New Benin",
          approvalStatus: "approved",
        },
        {
          id: "vendor-b",
          slug: "oba-provisions",
          shopName: "Oba Provisions",
          marketName: "Oba Market",
          marketArea: "Ring Road",
          approvalStatus: "approved",
        },
      ],
      [
        { vendorId: "vendor-a", name: "Fabric 1", imageUrl: "/images/1.webp" },
        { vendorId: "vendor-a", name: "Fabric 2", imageUrl: "/images/2.webp" },
        { vendorId: "vendor-a", name: "Fabric 3", imageUrl: "/images/3.webp" },
        { vendorId: "vendor-a", name: "Fabric 4", imageUrl: "/images/4.webp" },
      ],
      [
        { vendorId: "vendor-a", rating: 5 },
        { vendorId: "vendor-a", rating: 3 },
      ],
    );

    expect(result[0].averageRating).toBe(4);
    expect(result[0].reviewCount).toBe(2);
    expect(result[0].isVerified).toBe(true);
    expect(result[0].products).toHaveLength(3);
    expect(result[0]).not.toHaveProperty("id");
    expect(result[0]).not.toHaveProperty("userId");
    expect(result[0]).not.toHaveProperty("email");
    expect(result[0]).not.toHaveProperty("payoutAccount");
    expect(result[1].averageRating).toBeNull();
    expect(result[1].reviewCount).toBe(0);
    expect(result[1].products).toEqual([]);
  });
});
