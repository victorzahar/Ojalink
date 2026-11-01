import "server-only";

import { asc, desc, eq, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { categories, markets, orders, products, reviews, vendors } from "@/lib/db/schema";
import {
  approvedVendorSlugScope,
  deliveredVendorReviewsScope,
  isValidPublicVendorSlug,
  projectPublicVendorStorefront,
  publicVendorProductsScope,
} from "@/lib/vendors/public-storefront-scopes";

export async function getPublicVendorStorefront(slug: string) {
  if (!isValidPublicVendorSlug(slug)) return null;

  const db = getDb();
  const [vendor] = await db
    .select({
      id: vendors.id,
      slug: vendors.slug,
      shopName: vendors.shopName,
      description: vendors.description,
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
        name: products.name,
        description: products.description,
        categoryName: categories.name,
        priceKobo: products.priceKobo,
        inStock: sql<boolean>`${products.stockQuantity} > 0`,
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
}
