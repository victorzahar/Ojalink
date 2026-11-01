import { and, eq } from "drizzle-orm";

import { orders, products, reviews, vendors } from "@/lib/db/schema";

export function isValidPublicVendorSlug(slug: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

export function approvedVendorSlugScope(slug: string) {
  return and(eq(vendors.slug, slug), eq(vendors.approvalStatus, "approved"));
}

export function publicVendorProductsScope(vendorId: string) {
  return and(eq(products.vendorId, vendorId), eq(products.isAvailable, true));
}

export function deliveredVendorReviewsScope(vendorId: string) {
  return and(eq(reviews.vendorId, vendorId), eq(orders.status, "delivered"));
}

function localImagePath(imageUrl: string | null) {
  return imageUrl?.startsWith("/") && !imageUrl.startsWith("//") ? imageUrl : null;
}

export function projectPublicVendorStorefront<
  Vendor extends {
    slug: string;
    shopName: string;
    description: string | null;
    marketName: string;
    marketArea: string;
  },
  Product extends {
    slug: string;
    name: string;
    description: string | null;
    categoryName: string;
    priceKobo: number;
    inStock: boolean;
    imageUrl: string | null;
  },
  Review extends {
    rating: number;
    comment: string | null;
    createdAt: Date;
  },
>(vendor: Vendor, products: Product[], reviews: Review[]) {
  return {
    vendor: {
      slug: vendor.slug,
      shopName: vendor.shopName,
      description: vendor.description,
      marketName: vendor.marketName,
      marketArea: vendor.marketArea,
    },
    products: products.map((product) => ({
      slug: product.slug,
      name: product.name,
      description: product.description,
      categoryName: product.categoryName,
      priceKobo: product.priceKobo,
      inStock: product.inStock,
      imageUrl: localImagePath(product.imageUrl),
    })),
    reviews: reviews.map((review) => ({
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
    })),
  };
}
