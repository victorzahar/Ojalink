import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductForm } from "@/components/vendor-products/product-form";
import { requireVendorUser } from "@/lib/vendor-products/access";
import { getVendorProduct, getVendorIdForUser, listProductCategories } from "@/lib/vendor-products/queries";

export const instant = false;
export const metadata = { title: "Edit product · OjaLink" };

export default async function EditVendorProductPage({ params }: { params: Promise<{ productId: string }> }) {
  const user = await requireVendorUser();
  const { productId } = await params;
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(productId)) notFound();
  const vendorId = await getVendorIdForUser(user.id);
  if (!vendorId) notFound();
  const [product, categories] = await Promise.all([getVendorProduct(vendorId, productId), listProductCategories()]);
  if (!product) notFound();
  return <main className="mx-auto flex min-h-svh w-full max-w-2xl flex-col gap-5 px-4 py-8 sm:px-6">
    <Link href="/vendor/products" className="min-h-11 self-start py-3 text-sm font-medium text-primary">← Back to my products</Link>
    <header><p className="text-sm font-medium text-muted-foreground">Your shop</p><h1 className="font-heading text-3xl font-bold">Edit product</h1></header>
    <ProductForm categories={categories} product={product} />
  </main>;
}
