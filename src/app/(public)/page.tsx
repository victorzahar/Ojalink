import Link from "next/link";
import { Search, Store, MapPin, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { getCategories, getFeaturedVendors } from "@/lib/marketplace/queries";

export const instant = false;

export default async function HomePage() {
  const [categoriesList, featuredVendorsList] = await Promise.all([
    getCategories(),
    getFeaturedVendors(6),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-4 py-8 sm:px-6 sm:py-12">
      {/* Hero Section */}
      <section className="flex flex-col items-center text-center space-y-4 max-w-2xl mx-auto pt-2 sm:pt-6">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl sm:leading-tight">
          Benin City Market, Online
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
          Order fresh food, fabrics, electronics, and daily provisions from trusted local market vendors and have them delivered.
        </p>

        {/* Search Box */}
        <form
          action="/marketplace"
          method="GET"
          className="w-full pt-4 flex flex-col sm:flex-row gap-2.5 sm:gap-3"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-5 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              name="q"
              placeholder="Search for yam, rice, fabrics, phones..."
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
      </section>

      {/* Categories Section */}
      <section className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Browse by category
          </h2>
          <Link
            href="/marketplace"
            className="text-sm font-semibold text-primary hover:underline flex items-center gap-1"
          >
            All products
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {categoriesList.map((category) => (
            <Link
              key={category.id}
              href={`/marketplace?category=${encodeURIComponent(category.slug)}`}
              className="group flex flex-col items-center justify-center p-4 sm:p-5 rounded-xl border border-border/80 bg-card hover:border-primary hover:shadow-xs transition-all text-center"
            >
              <span className="font-heading font-semibold text-foreground group-hover:text-primary transition-colors text-base sm:text-lg">
                {category.name}
              </span>
              <span className="text-xs text-muted-foreground mt-1">Explore goods &rarr;</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Vendors Section */}
      {featuredVendorsList.length > 0 && (
        <section className="space-y-4 pt-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <h2 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Featured vendors
              </h2>
              <span className="bg-[#E8730C] text-[#1B1B1F] font-semibold text-xs px-2.5 py-0.5 rounded-full">
                Featured
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Approved sellers from verified Benin City markets
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredVendorsList.map((vendor) => (
              <Card
                key={vendor.id}
                className="rounded-xl border border-border/80 bg-card shadow-xs hover:border-primary/60 transition-all flex flex-col justify-between p-5"
              >
                <CardContent className="p-0 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <Store className="size-5" />
                      </div>
                      <h3 className="font-heading text-lg font-bold text-foreground line-clamp-1">
                        {vendor.shopName}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="size-3.5 shrink-0 text-primary" />
                    <span>
                      {vendor.marketName} &middot; {vendor.marketArea}
                    </span>
                  </div>

                  {vendor.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 pt-1 leading-relaxed">
                      {vendor.description}
                    </p>
                  )}
                </CardContent>

                <div className="pt-4 mt-auto">
                  <Button
                    asChild
                    variant="outline"
                    className="h-12 w-full font-semibold border-primary/40 text-primary hover:bg-primary hover:text-white rounded-lg"
                  >
                    <Link
                      href={`/marketplace?q=${encodeURIComponent(vendor.shopName)}`}
                    >
                      View shop products
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Call to action footer banner */}
      <section className="rounded-2xl border border-primary/20 bg-primary/5 p-6 sm:p-8 text-center space-y-3 mt-4">
        <h2 className="font-heading text-xl sm:text-2xl font-bold text-foreground">
          Ready to order from the market?
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto">
          Explore all approved products, compare real prices in Naira, and order directly to your doorstep.
        </p>
        <div className="pt-2">
          <Button
            asChild
            className="h-12 px-6 font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg w-full sm:w-auto"
          >
            <Link href="/marketplace">
              Go to marketplace
              <ArrowRight className="size-4 ml-1.5" />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
