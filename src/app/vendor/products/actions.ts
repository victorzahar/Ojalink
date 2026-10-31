"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireVendorUser } from "@/lib/vendor-products/access";
import { getDb } from "@/lib/db";
import { categories, products } from "@/lib/db/schema";
import { getVendorIdForUser } from "@/lib/vendor-products/queries";
import { validateProductForm } from "@/lib/vendor-products/validation";

export type ProductFormState = { error?: string };

async function saveProduct(formData: FormData, productId?: string): Promise<ProductFormState> {
  const user = await requireVendorUser();
  const vendorId = await getVendorIdForUser(user.id);
  if (!vendorId) return { error: "Your seller profile is not ready yet. Please contact the team." };

  const result = validateProductForm(formData);
  if (!result.success) return { error: result.error };

  try {
    const db = getDb();
    const [category] = await db.select({ id: categories.id }).from(categories).where(eq(categories.id, result.data.categoryId)).limit(1);
    if (!category) return { error: "That category is no longer available. Choose another one." };

    if (productId) {
      const updated = await db.update(products).set({
        name: result.data.name,
        description: result.data.description || null,
        categoryId: result.data.categoryId,
        priceKobo: result.data.priceKobo,
        stockQuantity: result.data.stockQuantity,
        isAvailable: result.data.isAvailable,
      }).where(and(eq(products.id, productId), eq(products.vendorId, vendorId))).returning({ id: products.id });
      if (updated.length === 0) return { error: "We could not find that product in your shop." };
    } else {
      const slugBase = result.data.name.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70) || "product";
      await db.insert(products).values({
        vendorId,
        categoryId: result.data.categoryId,
        name: result.data.name,
        slug: `${slugBase}-${crypto.randomUUID().slice(0, 8)}`,
        description: result.data.description || null,
        priceKobo: result.data.priceKobo,
        stockQuantity: result.data.stockQuantity,
        imageUrl: null,
        isAvailable: result.data.isAvailable,
      });
    }
  } catch {
    return { error: "We couldn’t save your product. Check your connection and try again." };
  }

  revalidatePath("/vendor/products");
  revalidatePath("/vendor");
  redirect("/vendor/products");
}

export async function createProduct(_state: ProductFormState, formData: FormData) {
  return saveProduct(formData);
}

export async function updateProduct(productId: string, _state: ProductFormState, formData: FormData) {
  return saveProduct(formData, productId);
}
