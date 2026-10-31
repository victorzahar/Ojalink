import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductForm } from "@/components/vendor-products/product-form";
import { requireVendorUser } from "@/lib/vendor-products/access";
import { getVendorIdForUser, listProductCategories } from "@/lib/vendor-products/queries";

export const instant = false;
export const metadata = { title: "Add a product · OjaLink" };

export default async function NewVendorProductPage() {
  const user = await requireVendorUser();
  if (!(await getVendorIdForUser(user.id))) notFound();
  const categories = await listProductCategories();
  return <main className="mx-auto flex min-h-svh w-full max-w-2xl flex-col gap-5 px-4 py-8 sm:px-6">
    <Link href="/vendor/products" className="min-h-11 self-start py-3 text-sm font-medium text-primary">← Back to my products</Link>
    <header><p className="text-sm font-medium text-muted-foreground">Your shop</p><h1 className="font-heading text-3xl font-bold">Add a product</h1></header>
    {categories.length === 0 ? <p role="status" className="rounded-lg bg-muted p-4 text-sm">Products can’t be added until the team sets up product categories.</p> : <ProductForm categories={categories} />}
  </main>;
}
