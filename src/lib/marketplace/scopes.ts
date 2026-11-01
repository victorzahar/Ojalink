import { and, eq, ilike } from "drizzle-orm";

import { categories, products, vendors } from "@/lib/db/schema";

/**
 * Ensures only vendors with approval_status = 'approved' are selected.
 */
export function approvedVendorsScope() {
  return eq(vendors.approvalStatus, "approved");
}

/**
 * Ensures only approved vendors with is_featured = true are selected.
 */
export function featuredVendorsScope() {
  return and(
    eq(vendors.approvalStatus, "approved"),
    eq(vendors.isFeatured, true)
  )!;
}

/**
 * Ensures only active products from approved vendors are selected.
 */
export function activeProductsScope() {
  return and(
    eq(vendors.approvalStatus, "approved"),
    eq(products.isAvailable, true)
  )!;
}

/**
 * Builds the where condition for marketplace product search.
 * Always parameterised, never exposes unapproved vendors or inactive products.
 */
export function productSearchScope(options: { q?: string; categorySlug?: string } = {}) {
  const conditions = [
    eq(vendors.approvalStatus, "approved"),
    eq(products.isAvailable, true),
  ];

  const trimmedQuery = options.q?.trim();
  if (trimmedQuery) {
    conditions.push(ilike(products.name, `%${trimmedQuery}%`));
  }

  const trimmedCategory = options.categorySlug?.trim();
  if (trimmedCategory) {
    conditions.push(eq(categories.slug, trimmedCategory));
  }

  return and(...conditions)!;
}
