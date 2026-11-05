import { and, eq, inArray } from "drizzle-orm";

import { orders, products, reviews, vendors } from "@/lib/db/schema";

export function isValidPublicVendorSlug(slug: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

export function approvedVendorSlugScope(slug: string) {
  return and(eq(vendors.slug, slug), eq(vendors.approvalStatus, "approved"));
}

export function approvedVendorsScope() {
  return eq(vendors.approvalStatus, "approved");
}

export function publicVendorProductsScope(vendorId: string) {
  return eq(products.vendorId, vendorId);
}

export function deliveredVendorReviewsScope(vendorId: string) {
  return and(
    eq(reviews.vendorId, vendorId),
    eq(reviews.vendorId, orders.vendorId),
    eq(orders.status, "delivered"),
  );
}

export function deliveredVendorsReviewsScope(vendorIds: string[]) {
  return and(
    inArray(reviews.vendorId, vendorIds),
    eq(reviews.vendorId, orders.vendorId),
    eq(orders.status, "delivered"),
  );
}

function localImagePath(imageUrl: string | null) {
  return imageUrl?.startsWith("/") && !imageUrl.startsWith("//") ? imageUrl : null;
}

export function projectPublicVendorStorefront<
  Vendor extends {
    id: string;
    slug: string;
    shopName: string;
    description: string | null;
    marketName: string;
    marketArea: string;
    approvalStatus: string;
  },
  Product extends {
    vendorId: string;
    slug: string;
    name: string;
    description: string | null;
    categoryName: string;
    priceKobo: number;
    stockQuantity: number;
    isAvailable: boolean;
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
      isVerified: vendor.approvalStatus === "approved",
    },
    products: products.map((product) => ({
      slug: product.slug,
      name: product.name,
      description: product.description,
      categoryName: product.categoryName,
      priceKobo: product.priceKobo,
      inStock: product.isAvailable && product.stockQuantity > 0,
      imageUrl: localImagePath(product.imageUrl),
    })),
    reviews: reviews.map((review) => ({
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
    })),
  };
}

export function projectPublicVendorList<
  Vendor extends {
    id: string;
    slug: string;
    shopName: string;
    marketName: string;
    marketArea: string;
    approvalStatus: string;
  },
  Product extends {
    vendorId: string;
    name: string;
    imageUrl: string | null;
  },
  Review extends {
    vendorId: string;
    rating: number;
  },
>(vendors: Vendor[], products: Product[], reviews: Review[]) {
  const reviewSummaries = new Map<string, { total: number; count: number }>();
  for (const review of reviews) {
    const summary = reviewSummaries.get(review.vendorId) ?? { total: 0, count: 0 };
    summary.total += review.rating;
    summary.count += 1;
    reviewSummaries.set(review.vendorId, summary);
  }

  return vendors.map((vendor) => {
    const summary = reviewSummaries.get(vendor.id);
    return {
      slug: vendor.slug,
      shopName: vendor.shopName,
      marketName: vendor.marketName,
      marketArea: vendor.marketArea,
      isVerified: vendor.approvalStatus === "approved",
      averageRating: summary ? summary.total / summary.count : null,
      reviewCount: summary?.count ?? 0,
      products: products
        .filter((product) => product.vendorId === vendor.id)
        .slice(0, 3)
        .map((product) => ({
          name: product.name,
          imageUrl: localImagePath(product.imageUrl),
        })),
    };
  });
}
