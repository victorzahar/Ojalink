import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { formatDateLagos, formatNaira } from "@/lib/orders/format";
import { getPublicVendorStorefront } from "@/lib/vendors/public-storefront";

type VendorPageProps = {
  params: Promise<{ slug: string }>;
};

function readableSlug(slug: string) {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export async function generateMetadata({ params }: VendorPageProps) {
  const { slug } = await params;

  return {
    title: `${readableSlug(slug)} | OjaLink`,
    description: `Shop products from ${readableSlug(slug)} in Benin City.`,
  };
}

async function StorefrontContent({ params }: VendorPageProps) {
  const { slug } = await params;
  const storefront = await getPublicVendorStorefront(slug);

  if (!storefront) notFound();

  const { vendor, products, reviews } = storefront;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <Link href="/" className="mb-6 inline-flex min-h-12 items-center rounded-md text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
        Back to OjaLink
      </Link>

      <header className="rounded-xl bg-card p-5 ring-1 ring-foreground/10 sm:p-8">
        <p className="text-sm font-medium text-muted-foreground">Vendor shop</p>
        <h1 className="mt-2 text-2xl font-bold leading-tight sm:text-3xl">{vendor.shopName}</h1>
        <p className="mt-3 text-base text-muted-foreground">
          {vendor.marketName} · {vendor.marketArea}, Benin City
        </p>
        {vendor.description && <p className="mt-4 max-w-2xl">{vendor.description}</p>}
      </header>

      <section aria-labelledby="products-heading" className="mt-10">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">From this shop</p>
            <h2 id="products-heading" className="mt-1 text-xl font-bold leading-tight">Products</h2>
          </div>
          <p className="text-sm text-muted-foreground">Cart and checkout are coming soon.</p>
        </div>

        {products.length === 0 ? (
          <p className="rounded-xl bg-card p-5 text-muted-foreground ring-1 ring-foreground/10">
            This shop has no products available right now.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <li key={product.slug} className="flex flex-col overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
                <Image
                  src={product.imageUrl ?? "/images/product-placeholder.svg"}
                  alt={product.imageUrl ? `Photo of ${product.name}` : `No product photo available for ${product.name}`}
                  width={640}
                  height={480}
                  className="aspect-[4/3] w-full object-cover"
                />
                <div className="flex flex-1 flex-col p-4">
                  <p className="text-sm text-muted-foreground">{product.categoryName}</p>
                  <h3 className="mt-1 text-base font-semibold leading-snug">{product.name}</h3>
                  {product.description && <p className="mt-2 text-sm text-muted-foreground">{product.description}</p>}
                  <p className="mt-4 text-lg font-bold">{formatNaira(product.priceKobo)}</p>
                  <div className="mt-auto pt-4">
                    <Button type="button" disabled className="w-full">
                      {product.inStock ? "Add to cart" : "Out of stock"}
                    </Button>
                    {product.inStock && (
                      <p className="mt-2 text-sm text-muted-foreground">Cart and checkout are coming soon.</p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="reviews-heading" className="mt-10">
        <h2 id="reviews-heading" className="text-xl font-bold leading-tight">Customer reviews</h2>
        {reviews.length === 0 ? (
          <p className="mt-4 rounded-xl bg-card p-5 text-muted-foreground ring-1 ring-foreground/10">
            This shop has no reviews yet.
          </p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {reviews.map((review, index) => (
              <li key={`${review.createdAt.toISOString()}-${index}`} className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
                <p className="font-semibold">{review.rating} out of 5</p>
                {review.comment && <p className="mt-2">{review.comment}</p>}
                <p className="mt-3 text-sm text-muted-foreground">{formatDateLagos(review.createdAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StorefrontFallback() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12" aria-busy="true">
      <p className="rounded-xl bg-card p-5 text-muted-foreground ring-1 ring-foreground/10">
        Loading vendor shop…
      </p>
    </div>
  );
}

export default function VendorPage({ params }: VendorPageProps) {
  return (
    <main className="flex-1">
      <Suspense fallback={<StorefrontFallback />}>
        <StorefrontContent params={params} />
      </Suspense>
    </main>
  );
}
