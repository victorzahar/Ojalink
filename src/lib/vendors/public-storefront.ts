import "server-only";

import { cache } from "react";
import { asc, desc, eq, inArray } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { categories, markets, orders, products, reviews, vendors } from "@/lib/db/schema";
import {
  approvedVendorSlugScope,
  approvedVendorsScope,
  deliveredVendorReviewsScope,
  deliveredVendorsReviewsScope,
  isValidPublicVendorSlug,
  projectPublicVendorList,
  projectPublicVendorStorefront,
  publicVendorProductsScope,
} from "@/lib/vendors/public-storefront-scopes";

export const getPublicVendorStorefront = cache(async (slug: string) => {
  if (!isValidPublicVendorSlug(slug)) return null;

  const db = getDb();
  const [vendor] = await db
    .select({
      id: vendors.id,
      slug: vendors.slug,
      shopName: vendors.shopName,
      description: vendors.description,
      approvalStatus: vendors.approvalStatus,
      marketName: markets.name,
      marketArea: markets.area,
    })
    .from(vendors)
    .innerJoin(markets, eq(vendors.marketId, markets.id))
    .where(approvedVendorSlugScope(slug))
    .limit(1);

  if (!vendor) return null;

  const [productRows, reviewRows] = await Promise.all([
    db
      .select({
        slug: products.slug,
        vendorId: products.vendorId,
        name: products.name,
        description: products.description,
        categoryName: categories.name,
        priceKobo: products.priceKobo,
        stockQuantity: products.stockQuantity,
        isAvailable: products.isAvailable,
        imageUrl: products.imageUrl,
      })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(publicVendorProductsScope(vendor.id))
      .orderBy(asc(products.name)),
    db
      .select({
        rating: reviews.rating,
        comment: reviews.comment,
        createdAt: reviews.createdAt,
      })
      .from(reviews)
      .innerJoin(orders, eq(reviews.orderId, orders.id))
      .where(deliveredVendorReviewsScope(vendor.id))
      .orderBy(desc(reviews.createdAt))
      .limit(8),
  ]);

  return projectPublicVendorStorefront(vendor, productRows, reviewRows);
});

export async function getPublicVendorDirectory() {
  const db = getDb();
  const vendorRows = await db
    .select({
      id: vendors.id,
      slug: vendors.slug,
      shopName: vendors.shopName,
      approvalStatus: vendors.approvalStatus,
      marketName: markets.name,
      marketArea: markets.area,
    })
    .from(vendors)
    .innerJoin(markets, eq(vendors.marketId, markets.id))
    .where(approvedVendorsScope())
    .orderBy(asc(vendors.shopName));

  if (vendorRows.length === 0) return [];

  const vendorIds = vendorRows.map((vendor) => vendor.id);
  const [productRows, reviewRows] = await Promise.all([
    db
      .select({
        vendorId: products.vendorId,
        name: products.name,
        imageUrl: products.imageUrl,
      })
      .from(products)
      .where(inArray(products.vendorId, vendorIds))
      .orderBy(asc(products.name)),
    db
      .select({
        vendorId: reviews.vendorId,
        rating: reviews.rating,
      })
      .from(reviews)
      .innerJoin(orders, eq(reviews.orderId, orders.id))
      .where(deliveredVendorsReviewsScope(vendorIds)),
  ]);

  return projectPublicVendorList(vendorRows, productRows, reviewRows);
}
