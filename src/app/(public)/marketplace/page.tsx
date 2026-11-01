import Link from "next/link";
import { Search, Store, X, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { formatNaira } from "@/lib/orders/format";
import { getCategories, searchProducts } from "@/lib/marketplace/queries";

export const instant = false;

type MarketplacePageProps = {
  searchParams: Promise<{
    q?: string | string[];
    category?: string | string[];
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

  const [categoriesList, productsList] = await Promise.all([
    getCategories(),
    searchProducts({ q, categorySlug }),
  ]);

  const activeCategory = categoriesList.find((c) => c.slug === categorySlug);
  const hasFilter = Boolean(q || categorySlug);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="text-xs font-semibold text-muted-foreground hover:text-primary flex items-center gap-1"
          >
            <ArrowLeft className="size-3.5" />
            Back to Home
          </Link>
        </div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Marketplace
        </h1>
        <p className="text-sm text-muted-foreground">
          Real products and real Naira prices from verified Benin City market vendors.
        </p>
      </div>

      {/* Search Bar Form */}
      <form
        action="/marketplace"
        method="GET"
        className="flex flex-col sm:flex-row gap-2.5 sm:gap-3"
      >
        {categorySlug && (
          <input type="hidden" name="category" value={categorySlug} />
        )}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-5 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search by product name..."
            aria-label="Search products"
            className="h-12 w-full pl-11 rounded-lg border-border bg-card text-base shadow-xs"
          />
        </div>
        <Button
          type="submit"
          className="h-12 w-full sm:w-auto px-6 font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg shrink-0"
        >
          Search products
        </Button>
      </form>

      {/* Category Pills Filter */}
      <div className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Categories
        </span>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <Link
            href={q ? `/marketplace?q=${encodeURIComponent(q)}` : "/marketplace"}
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
            }`;

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
        <div className="space-y-3">
          <div className="text-xs text-muted-foreground font-medium">
            Showing {productsList.length} product{productsList.length === 1 ? "" : "s"}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {productsList.map((product) => (
              <Card
                key={product.id}
                className="rounded-xl border border-border/80 bg-card shadow-xs hover:border-primary/50 transition-all flex flex-col justify-between p-4 sm:p-5"
              >
                <CardContent className="p-0 space-y-3">
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
                    <h2 className="font-heading text-lg font-bold text-foreground line-clamp-2 leading-snug">
                      {product.name}
                    </h2>
                    {product.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                        {product.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                    <Store className="size-3.5 text-primary shrink-0" />
                    <span className="line-clamp-1 font-medium">
                      Sold by {product.vendorShopName}
                    </span>
                  </div>

                  {/* Formatted Naira Price */}
                  <div className="pt-2">
                    <span className="text-xs text-muted-foreground block font-medium">
                      Price
                    </span>
                    <span className="font-heading text-xl sm:text-2xl font-bold text-primary tracking-tight">
                      {formatNaira(product.priceKobo)}
                    </span>
                  </div>
                </CardContent>

                {/* View Product action button (copy from docs/content-guide.md) */}
                <div className="pt-4 mt-auto">
                  <Button
                    asChild
                    className="h-12 w-full font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg"
                  >
                    <Link
                      href={`/marketplace?q=${encodeURIComponent(product.name)}`}
                    >
                      View product
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
