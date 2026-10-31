import { desc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { categories, products, vendors } from "@/lib/db/schema";
import { vendorProductScope, vendorProductsScope } from "@/lib/vendor-products/ownership";

export async function getVendorIdForUser(userId: string) {
  const [vendor] = await getDb()
    .select({ id: vendors.id })
    .from(vendors)
    .where(eq(vendors.userId, userId))
    .limit(1);
  return vendor?.id ?? null;
}

export async function listVendorProducts(vendorId: string) {
  return getDb()
    .select({
      id: products.id,
      name: products.name,
      description: products.description,
      priceKobo: products.priceKobo,
      stockQuantity: products.stockQuantity,
      imageUrl: products.imageUrl,
      isAvailable: products.isAvailable,
      categoryName: categories.name,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(vendorProductsScope(vendorId))
    .orderBy(desc(products.createdAt));
}

export async function getVendorProduct(vendorId: string, productId: string) {
  const [product] = await getDb()
    .select({
      id: products.id,
      name: products.name,
      description: products.description,
      categoryId: products.categoryId,
      priceKobo: products.priceKobo,
      stockQuantity: products.stockQuantity,
      imageUrl: products.imageUrl,
      isAvailable: products.isAvailable,
    })
    .from(products)
    .where(vendorProductScope(vendorId, productId))
    .limit(1);
  return product ?? null;
}

export async function listProductCategories() {
  return getDb().select({ id: categories.id, name: categories.name }).from(categories).orderBy(categories.name);
}
