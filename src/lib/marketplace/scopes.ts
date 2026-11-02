import { and, eq, ilike, or } from "drizzle-orm";

import { categories, products, vendors } from "@/lib/db/schema";

/**
 * Escapes PostgreSQL LIKE/ILIKE wildcard characters (% and _) and backslash.
 */
export function escapeLikePattern(input: string): string {
  return input.replace(/[%_\\]/g, "\\$&");
}

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
 * Escapes LIKE wildcards and supports searching by product name or vendor shop name,
 * as well as filtering by category slug and vendor slug.
 */
export function productSearchScope(
  options: { q?: string; categorySlug?: string; vendorSlug?: string } = {}
) {
  const conditions = [
    eq(vendors.approvalStatus, "approved"),
    eq(products.isAvailable, true),
  ];

  const trimmedQuery = options.q?.trim();
  if (trimmedQuery) {
    const escaped = escapeLikePattern(trimmedQuery);
    conditions.push(
      or(
        ilike(products.name, `%${escaped}%`),
        ilike(vendors.shopName, `%${escaped}%`)
      )!
    );
  }

  const trimmedCategory = options.categorySlug?.trim();
  if (trimmedCategory) {
    conditions.push(eq(categories.slug, trimmedCategory));
  }

  const trimmedVendor = options.vendorSlug?.trim();
  if (trimmedVendor) {
    conditions.push(eq(vendors.slug, trimmedVendor));
  }

  return and(...conditions)!;
}
