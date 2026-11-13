import Link from "next/link";
import Image from "next/image";
import { Search, Store, X, ArrowLeft, ShoppingCart, SlidersHorizontal } from "lucide-react";


import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { formatNaira } from "@/lib/orders/format";
import { getCategories, searchProducts } from "@/lib/marketplace/queries";
import { demoProductImage } from "@/lib/products/demo-product-images";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";

export const instant = false;

type MarketplacePageProps = {
  searchParams: Promise<{
    q?: string | string[];
    category?: string | string[];
    vendor?: string | string[];
  }>;
};

export default async function MarketplacePage({
  searchParams,
}: MarketplacePageProps) {
  const resolvedParams = await searchParams;
  const q = typeof resolvedParams.q === "string" ? resolvedParams.q.trim() : undefined;
  const categorySlug =
    typeof resolvedParams.category === "string"
      ? resolvedParams.category.trim()
      : undefined;
  const vendorSlug =
    typeof resolvedParams.vendor === "string"
      ? resolvedParams.vendor.trim()
      : undefined;

  const [categoriesList, productsList] = await Promise.all([
    getCategories(),
    searchProducts({ q, categorySlug, vendorSlug }),
  ]);

  const activeCategory = categoriesList.find((c) => c.slug === categorySlug);
  const hasFilter = Boolean(q || categorySlug || vendorSlug);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10">
      {/* Header */}
      <div className="flex flex-col gap-2 rounded-2xl border border-border/80 bg-card p-4 shadow-sm sm:p-6">
        <div className="flex items-center gap-2">
          <Link
            href="/home"
            className="text-xs font-semibold text-muted-foreground hover:text-primary flex items-center gap-1"
          >
            <ArrowLeft className="size-3.5" />
            Back to Home
          </Link>
        </div>
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Marketplace
          </h1>
          <Button asChild variant="outline" className="h-11 w-auto shrink-0 px-3 sm:px-4">
            <Link href="/cart">
              <ShoppingCart className="size-4" />
              View cart
            </Link>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Real products and real Naira prices from verified Benin City market vendors.
        </p>
      </div>

      {/* Search Bar Form */}
      <form
        action="/marketplace"
        method="GET"
        className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 rounded-2xl border border-border/80 bg-card p-3 shadow-sm"
      >
        {categorySlug && (
          <input type="hidden" name="category" value={categorySlug} />
        )}
        {vendorSlug && (
          <input type="hidden" name="vendor" value={vendorSlug} />
        )}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-5 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search by product name..."
            aria-label="Search products"
            className="h-12 w-full pl-11 rounded-xl border-border bg-background text-base shadow-none"
          />
        </div>
        <Button
          type="submit"
          className="h-12 w-full sm:w-auto px-6 font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl shrink-0"
        >
          Search products
        </Button>
      </form>

      {/* Category Pills Filter */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <SlidersHorizontal className="size-4 text-primary" />
          <span>Browse categories</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none snap-x">
          <Link
            href={
              q || vendorSlug
                ? `/marketplace?${[
                    q ? `q=${encodeURIComponent(q)}` : "",
                    vendorSlug ? `vendor=${encodeURIComponent(vendorSlug)}` : "",
                  ].filter(Boolean).join("&")}`
                : "/marketplace"
            }
            className={`inline-flex h-11 items-center px-4 rounded-full text-sm font-semibold whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 shrink-0 ${
              !categorySlug
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-foreground hover:border-primary/60"
            }`}
          >
            All categories
          </Link>

          {categoriesList.map((category) => {
            const isSelected = category.slug === categorySlug;
            const categoryUrl = `/marketplace?category=${encodeURIComponent(category.slug)}${
              q ? `&q=${encodeURIComponent(q)}` : ""
            }${vendorSlug ? `&vendor=${encodeURIComponent(vendorSlug)}` : ""}`;

            return (
              <Link
                key={category.id}
                href={categoryUrl}
                className={`inline-flex h-11 items-center px-4 rounded-full text-sm font-semibold whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 shrink-0 ${
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-card text-foreground hover:border-primary/60"
                }`}
              >
                {category.name}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Active Filter Indicators */}
      {hasFilter && (
        <div className="flex items-center justify-between flex-wrap gap-2 rounded-lg bg-muted/30 px-3.5 py-2.5 text-xs sm:text-sm">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-muted-foreground">Filtered by:</span>
            {q && (
              <span className="font-semibold text-foreground bg-card border border-border px-2 py-0.5 rounded-md">
                Keyword: &ldquo;{q}&rdquo;
              </span>
            )}
            {activeCategory && (
              <span className="font-semibold text-foreground bg-card border border-border px-2 py-0.5 rounded-md">
                Category: {activeCategory.name}
              </span>
            )}
            {vendorSlug && (
              <span className="font-semibold text-foreground bg-card border border-border px-2 py-0.5 rounded-md">
                Shop: {productsList[0]?.vendorShopName ?? vendorSlug}
              </span>
            )}
          </div>
          <Link
            href="/marketplace"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            <X className="size-3.5" />
            Clear filters
          </Link>
        </div>
      )}

      {/* Products Grid or Empty State */}
      {productsList.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/60 p-8 sm:p-12 text-center space-y-4 my-6">
          <div className="size-12 rounded-full bg-muted/40 flex items-center justify-center text-muted-foreground">
            <Search className="size-6" />
          </div>
          <div className="space-y-1.5 max-w-md">
            <h3 className="font-heading text-lg font-bold text-foreground">
              No products found
            </h3>
            {/* Copy verbatim from docs/content-guide.md */}
            <p className="text-sm text-muted-foreground">
              We couldn&apos;t find anything for that search. Try another word or market.
            </p>
          </div>
          {hasFilter && (
            <Button asChild variant="outline" className="h-12 px-6 font-semibold border-primary text-primary hover:bg-primary hover:text-white rounded-lg">
              <Link href="/marketplace">
                View all products
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-xs text-muted-foreground font-medium">
            Showing {productsList.length} product{productsList.length === 1 ? "" : "s"}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {productsList.map((product) => {
              const vendorImage = product.imageUrl?.startsWith("/") && !product.imageUrl.startsWith("//")
                ? product.imageUrl
                : null;
              const sampleImage = demoProductImage(product.slug);
              const imageSrc = vendorImage ?? sampleImage ?? "/images/product-placeholder.svg";
              const isSampleImage = !vendorImage && sampleImage !== null;

              return (
              <Card
                key={product.id}
                className="group gap-0 overflow-hidden rounded-2xl border border-border/80 bg-card p-0 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="relative aspect-[4/3] w-full bg-muted sm:aspect-square">
                  <Image
                    src={imageSrc}
                    alt={isSampleImage ? `Sample photo for ${product.name}` : vendorImage ? `Photo of ${product.name}` : `No product photo available for ${product.name}`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                  {isSampleImage && (
                    <span className="absolute left-3 top-3 rounded-full bg-card/95 px-2.5 py-1 text-xs font-semibold text-foreground shadow-sm">
                      Sample photo
                    </span>
                  )}
                  {!vendorImage && !sampleImage && (
                    <span className="absolute bottom-3 left-3 rounded-full bg-card/95 px-2.5 py-1 text-xs font-medium text-muted-foreground shadow-sm">
                      Photo coming soon
                    </span>
                  )}
                </div>
                <CardContent className="flex flex-1 flex-col gap-2.5 p-3 sm:gap-3 sm:p-5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-muted-foreground bg-muted/40 px-2.5 py-0.5 rounded-md">
                      {product.categoryName}
                    </span>
                    {product.stockQuantity <= 5 && (
                      <span className="text-xs font-semibold text-[#E8730C]">
                        {product.stockQuantity === 0 ? "Out of stock" : `Only ${product.stockQuantity} left`}
                      </span>
                    )}
                  </div>

                  <div>
                    <h2 className="font-heading text-sm font-bold leading-snug text-foreground line-clamp-2 sm:text-lg">
                      {product.name}
                    </h2>
                    {product.description && (
                      <p className="hidden text-sm leading-relaxed text-muted-foreground line-clamp-2 mt-1 sm:block">
                        {product.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-1 sm:text-xs">
                    <Store className="size-3.5 text-primary shrink-0" />
                    <span className="line-clamp-1 font-medium">
                      Sold by {product.vendorShopName}
                    </span>
                  </div>

                  {/* Formatted Naira Price */}
                  <div className="pt-1 sm:pt-2">
                    <span className="hidden text-xs text-muted-foreground font-medium sm:block">
                      Price
                    </span>
                    <span className="font-heading text-base font-bold tracking-tight text-primary sm:text-2xl">
                      {formatNaira(product.priceKobo)}
                    </span>
                  </div>
                  {/* View Product action button (copy from docs/content-guide.md) */}
                  <Button
                    asChild
                    className="h-10 w-full px-2 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg sm:h-12 sm:px-4 sm:text-sm"
                  >
                    <Link
                      href={`/marketplace?q=${encodeURIComponent(product.name)}`}
                    >
                      View product
                    </Link>
                  </Button>
                </CardContent>
                

                {/* Add-to-cart is available directly from the product card. */}
                <div className="px-3 pb-3 mt-auto sm:px-5 sm:pb-5">
                  <AddToCartButton productId={product.id} disabled={product.stockQuantity < 1} />
                </div>
              </Card>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}
