"use client";

import Link from "next/link";
import Image from "next/image";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ProductFormState } from "@/app/vendor/products/actions";
import { createProduct, updateProduct } from "@/app/vendor/products/actions";
import { formatKoboAsNaira } from "@/lib/vendor-products/validation";

type Category = { id: string; name: string };
type ExistingProduct = {
  id: string;
  name: string;
  description: string | null;
  categoryId: string;
  priceKobo: number;
  stockQuantity: number;
  imageUrl: string | null;
  isAvailable: boolean;
};

export function ProductForm({ categories, product }: { categories: Category[]; product?: ExistingProduct }) {
  const action = product ? updateProduct.bind(null, product.id) : createProduct;
  const [state, formAction, pending] = useActionState(action, {} as ProductFormState);

  return (
    <Card><CardContent>
      <form action={formAction} className="flex flex-col gap-5">
        {state.error && <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{state.error}</p>}
        <label className="grid gap-2 text-sm font-medium">Product name
          <Input name="name" required maxLength={120} defaultValue={product?.name} placeholder="Ankara fabric" />
        </label>
        <label className="grid gap-2 text-sm font-medium">Category
          <select name="categoryId" required defaultValue={product?.categoryId ?? ""} className="h-12 w-full rounded-md border border-input bg-background px-3 text-base focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            <option value="" disabled>Choose a category</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">Description
          <textarea name="description" rows={4} defaultValue={product?.description ?? ""} className="w-full rounded-md border border-input bg-background px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50" placeholder="Tell buyers about this product" />
        </label>
        <label className="grid gap-2 text-sm font-medium">Price (₦)
          <Input name="priceNaira" type="number" min="0" step="0.01" inputMode="decimal" required defaultValue={product ? formatKoboAsNaira(product.priceKobo) : ""} placeholder="6500.00" />
          <span className="text-xs font-normal text-muted-foreground">Saved securely as kobo.</span>
        </label>
        <label className="grid gap-2 text-sm font-medium">Available stock
          <Input name="stockQuantity" type="number" min="0" step="1" inputMode="numeric" required defaultValue={product?.stockQuantity ?? 0} />
        </label>
        <label className="flex min-h-11 items-center gap-3 text-sm font-medium">
          <input type="checkbox" name="isAvailable" defaultChecked={product ? product.isAvailable : true} className="size-5 accent-primary" />
          Available for buyers
        </label>
        <p className="-mt-4 text-xs text-muted-foreground">Zero stock always saves as sold out. Adding stock later will not turn this on automatically.</p>
        <aside className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Product photo</p>
          {product?.imageUrl && <Image unoptimized src={product.imageUrl} alt={`Current photo of ${product.name}`} width={800} height={450} className="mt-3 aspect-video w-full rounded-md object-cover" />}
          <p className="mt-1">Photo uploads will be added after the team chooses a secure photo service.</p>
        </aside>
        <div className="grid gap-3 sm:flex sm:justify-end">
          <Button asChild variant="outline"><Link href="/vendor/products">Cancel</Link></Button>
          <Button type="submit" disabled={pending || categories.length === 0}>{pending ? "Saving…" : product ? "Save changes" : "Add product"}</Button>
        </div>
      </form>
    </CardContent></Card>
  );
}
