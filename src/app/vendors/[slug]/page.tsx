import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { VerifiedBadge } from "@/components/vendors/verified-badge";
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

export async function generateMetadata({ params }: VendorPageProps): Promise<Metadata> {
  const { slug } = await params;
  const storefront = await getPublicVendorStorefront(slug);

  if (!storefront) {
    return {
      title: `${readableSlug(slug)} shop not found`,
      description: `This OjaLink shop could not be found in Benin City. Browse other approved vendor shops.`,
    };
  }

  return {
    title: `${storefront.vendor.shopName} | ${slug}`,
    description: `Browse products from ${storefront.vendor.shopName} at ${storefront.vendor.marketName}, ${storefront.vendor.marketArea}, Benin City. Shop ${slug} on OjaLink.`,
  };
}

async function StorefrontContent({ params }: VendorPageProps) {
  const { slug } = await params;
  const storefront = await getPublicVendorStorefront(slug);

  if (!storefront) notFound();

  const { vendor, products, reviews } = storefront;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <Button asChild variant="link" className="mb-6 h-12 px-0">
        <Link href="/vendors">Back to vendor shops</Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <CardDescription>Vendor shop</CardDescription>
              <CardTitle className="mt-2 break-words font-heading text-2xl font-bold leading-tight sm:text-3xl">
                {vendor.shopName}
              </CardTitle>
            </div>
            {vendor.isVerified && <VerifiedBadge />}
          </div>
          <CardDescription className="text-base">
            {vendor.marketName} · {vendor.marketArea}, Benin City
          </CardDescription>
          {vendor.description && (
            <p className="max-w-2xl text-base text-muted-foreground">{vendor.description}</p>
          )}
        </CardHeader>
      </Card>

      <section aria-labelledby="products-heading" className="mt-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">From this shop</p>
            <h2 id="products-heading" className="mt-1 font-heading text-2xl font-bold leading-tight">
              Products
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">Cart and checkout are coming soon.</p>
        </div>

        {products.length === 0 ? (
          <Card>
            <CardContent className="py-5 text-muted-foreground">
              This shop has no products listed right now.
            </CardContent>
          </Card>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <li key={product.slug} className="min-w-0">
                <Card className="h-full">
                  <Image
                    src={product.imageUrl ?? "/images/product-placeholder.svg"}
                    alt={product.imageUrl ? `Photo of ${product.name}` : `No product photo available for ${product.name}`}
                    width={800}
                    height={800}
                    className="aspect-square w-full object-cover"
                  />
                  <CardContent className="flex flex-1 flex-col gap-2">
                    <CardDescription>{product.categoryName}</CardDescription>
                    <CardTitle className="break-words">{product.name}</CardTitle>
                    {product.description && (
                      <p className="text-sm text-muted-foreground">{product.description}</p>
                    )}
                    <p className="mt-2 text-lg font-bold">{formatNaira(product.priceKobo)}</p>
                    <div className="mt-auto pt-2">
                      <Button type="button" disabled className="w-full">
                        {product.inStock ? "Add to cart" : "Out of stock"}
                      </Button>
                      {product.inStock && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          Cart and checkout are coming soon.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="reviews-heading" className="mt-8">
        <h2 id="reviews-heading" className="font-heading text-2xl font-bold leading-tight">
          Customer reviews
        </h2>
        {reviews.length === 0 ? (
          <Card className="mt-4">
            <CardContent className="py-5 text-muted-foreground">
              This shop has no reviews yet.
            </CardContent>
          </Card>
        ) : (
          <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {reviews.map((review, index) => (
              <li key={`${review.createdAt.toISOString()}-${index}`}>
                <Card className="h-full">
                  <CardContent>
                    <p className="font-semibold">{review.rating} out of 5</p>
                    {review.comment && <p className="mt-2">{review.comment}</p>}
                    <p className="mt-3 text-sm text-muted-foreground">
                      {formatDateLagos(review.createdAt)}
                    </p>
                  </CardContent>
                </Card>
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
      <Card>
        <CardContent className="py-5 text-muted-foreground">Loading vendor shop…</CardContent>
      </Card>
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
