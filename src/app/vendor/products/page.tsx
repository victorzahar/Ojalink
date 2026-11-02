import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireVendorUser } from "@/lib/vendor-products/access";
import { getVendorIdForUser, listVendorProducts } from "@/lib/vendor-products/queries";

export const instant = false;
export const metadata = { title: "My products · OjaLink" };

export default async function VendorProductsPage() {
  const user = await requireVendorUser();
  const vendorId = await getVendorIdForUser(user.id);
  if (!vendorId) notFound();
  const items = await listVendorProducts(vendorId);

  return <main className="mx-auto flex min-h-svh w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-sm font-medium text-muted-foreground">Vendor area</p><h1 className="font-heading text-3xl font-bold">My products</h1><p className="mt-1 text-muted-foreground">Manage what buyers can find in your shop.</p></div>
      <Button asChild><Link href="/vendor/products/new">Add a product</Link></Button>
    </header>
    {items.length === 0 ? <Card><CardContent className="py-10 text-center"><h2 className="font-heading text-xl font-semibold">Your shop is ready for its first product</h2><p className="mt-2 text-muted-foreground">Add an item with its price and stock to get started.</p><Button asChild className="mt-5"><Link href="/vendor/products/new">Add your first product</Link></Button></CardContent></Card> :
      <ul className="grid gap-4 sm:grid-cols-2">{items.map((item) => <li key={item.id}><Card className="h-full"><CardContent className="flex h-full flex-col gap-3">
        {item.imageUrl ? <Image unoptimized src={item.imageUrl} alt={item.name} width={800} height={450} className="aspect-[16/9] w-full rounded-md object-cover" /> : <div aria-hidden="true" className="flex aspect-[16/9] items-center justify-center rounded-md bg-muted text-sm text-muted-foreground">Photo coming soon</div>}
        <div className="flex items-start justify-between gap-3"><div><h2 className="font-heading text-lg font-semibold">{item.name}</h2><p className="text-sm text-muted-foreground">{item.categoryName}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${item.isAvailable ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{item.isAvailable ? "Available" : "Sold out"}</span></div>
        <p className="text-lg font-semibold">₦{(item.priceKobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        <p className="text-sm text-muted-foreground">{item.stockQuantity} in stock</p>
        <Button asChild variant="outline" className="mt-auto"><Link href={`/vendor/products/${item.id}/edit`}>Edit product</Link></Button>
      </CardContent></Card></li>)}</ul>}
  </main>;
}
