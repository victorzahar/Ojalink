import "server-only";

import { desc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { categories, markets, products, vendors } from "@/lib/db/schema";
import {
  featuredVendorsScope,
  productSearchScope,
} from "@/lib/marketplace/scopes";

export type MarketplaceCategory = {
  id: string;
  name: string;
  slug: string;
};

export type FeaturedVendor = {
  id: string;
  shopName: string;
  slug: string;
  description: string | null;
  shopImageUrl: string | null;
  marketName: string;
  marketArea: string;
};

export type MarketplaceProduct = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  priceKobo: number;
  stockQuantity: number;
  imageUrl: string | null;
  vendorShopName: string;
  vendorSlug: string;
  categoryName: string;
  categorySlug: string;
};

/**
 * Returns all product categories ordered by name.
 */
export async function getCategories(): Promise<MarketplaceCategory[]> {
  const db = getDb();
  return db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
    })
    .from(categories)
    .orderBy(categories.name);
}

/**
 * Returns up to `limit` approved featured vendors, including market name and area.
 * Never exposes user emails or phone numbers.
 */
export async function getFeaturedVendors(limit = 6): Promise<FeaturedVendor[]> {
  const db = getDb();
  return db
    .select({
      id: vendors.id,
      shopName: vendors.shopName,
      slug: vendors.slug,
      description: vendors.description,
      shopImageUrl: vendors.shopImageUrl,
      marketName: markets.name,
      marketArea: markets.area,
    })
    .from(vendors)
    .innerJoin(markets, eq(vendors.marketId, markets.id))
    .where(featuredVendorsScope())
    .limit(limit);
}

/**
 * Searches approved vendors' active products by name query and/or category slug.
 * All query filters are fully parameterised via Drizzle expressions.
 * Never exposes unapproved vendors, inactive products, emails, or phone numbers.
 */
export async function searchProducts(options: {
  q?: string;
  categorySlug?: string;
}): Promise<MarketplaceProduct[]> {
  const db = getDb();
  return db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      description: products.description,
      priceKobo: products.priceKobo,
      stockQuantity: products.stockQuantity,
      imageUrl: products.imageUrl,
      vendorShopName: vendors.shopName,
      vendorSlug: vendors.slug,
      categoryName: categories.name,
      categorySlug: categories.slug,
    })
    .from(products)
    .innerJoin(vendors, eq(products.vendorId, vendors.id))
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(productSearchScope(options))
    .orderBy(desc(products.createdAt));
}
