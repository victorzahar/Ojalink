import Image from "next/image";
import Link from "next/link";
import {
  Apple,
  ArrowRight,
  ClipboardList,
  House,
  MapPin,
  Package,
  Plus,
  Search,
  Shirt,
  SlidersHorizontal,
  Smartphone,
  Store,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import type {
  FeaturedVendor,
  MarketplaceCategory,
  MarketplaceProduct,
} from "@/lib/marketplace/queries";
import { formatNaira } from "@/lib/orders/format";
import { demoProductImage } from "@/lib/products/demo-product-images";

const categoryIcons = {
  fabrics: Shirt,
  "fresh-produce": Apple,
  "phones-accessories": Smartphone,
  provisions: Package,
} as const;

function CategoryIcon({ slug }: { slug: string }) {
  const Icon = categoryIcons[slug as keyof typeof categoryIcons] ?? Package;
  return <Icon aria-hidden="true" className="size-6" strokeWidth={1.8} />;
}

export function HomePromoAndSearch() {
  return (
    <section className="overflow-hidden rounded-3xl bg-primary text-primary-foreground shadow-sm">
      <div className="grid gap-6 p-6 sm:p-8 md:grid-cols-[1fr_auto] md:items-center md:p-10">
        <div className="max-w-2xl space-y-3">
          <p className="text-sm font-semibold text-primary-foreground/80">OjaLink · Benin City</p>
          <h1 className="font-heading text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            Benin City Market, Online
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-primary-foreground/90">
            Order fresh food, fabrics, electronics, and daily provisions from trusted local market vendors and have them delivered.
          </p>
          <Button asChild variant="secondary" className="min-h-12 rounded-full px-5 font-semibold text-primary">
            <Link href="/marketplace">
              Go to marketplace
              <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
        </div>

        <form action="/marketplace" method="GET" className="w-full md:max-w-md">
          <label htmlFor="home-product-search" className="sr-only">Search products</label>
          <div className="flex min-h-14 items-center gap-2 rounded-full bg-card p-1.5 text-foreground shadow-sm">
            <Search aria-hidden="true" className="ml-3 size-5 shrink-0 text-muted-foreground" />
            <Input
              id="home-product-search"
              type="search"
              name="q"
              placeholder="Search for yam, rice, fabrics, phones..."
              className="h-11 min-w-0 flex-1 border-0 bg-transparent px-1 text-base shadow-none focus-visible:ring-0"
            />
            <Button type="submit" size="icon" aria-label="Search products" title="Search products" className="size-11 shrink-0 rounded-full">
              <Search className="size-5" />
            </Button>
            <Link href="/marketplace" aria-label="Filter products" title="Filter products" className="mr-1 flex size-11 shrink-0 items-center justify-center rounded-full text-primary outline-none hover:bg-primary/10 focus-visible:ring-3 focus-visible:ring-ring/50">
              <SlidersHorizontal aria-hidden="true" className="size-5" />
            </Link>
          </div>
        </form>
      </div>
    </section>
  );
}

export function MarketplaceTicker() {
  const items = [
    "Fresh produce",
    "Fruits & vegetables",
    "Fabrics",
    "Phones & accessories",
    "Rice & pantry provisions",
    "Household essentials",
  ];

  return (
    <section aria-label="What you can shop on OjaLink" className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <p className="sr-only">Marketplace categories: {items.join(", ")}.</p>
      <div className="flex min-h-14 items-center">
        <span aria-hidden="true" className="z-10 shrink-0 bg-card py-3 pl-4 pr-2 text-xs font-bold uppercase tracking-wide text-primary sm:px-5">
          Shop local
        </span>
        <div className="ojalink-marketplace-ticker-viewport min-w-0 flex-1 overflow-hidden" aria-hidden="true">
          <div className="ojalink-marketplace-ticker-track flex w-max">
            {[0, 1].map((copy) => (
              <div key={copy} className="flex shrink-0 items-center">
                {items.map((item) => (
                  <span key={`${copy}-${item}`} className="inline-flex shrink-0 items-center gap-4 px-4 text-sm font-medium text-foreground sm:px-6">
                    {item}
                    <span className="text-primary" aria-hidden="true">•</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes ojalink-marketplace-ticker {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .ojalink-marketplace-ticker-track {
          animation: ojalink-marketplace-ticker 34s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .ojalink-marketplace-ticker-viewport { overflow-x: auto; }
          .ojalink-marketplace-ticker-track { animation: none; }
        }
      `}</style>
    </section>
  );
}

export function HomeCategories({ categories }: { categories: MarketplaceCategory[] }) {
  return (
    <section className="space-y-4" aria-labelledby="home-categories-heading">
      <div className="flex items-center justify-between gap-3">
        <h2 id="home-categories-heading" className="font-heading text-xl font-bold sm:text-2xl">Browse by category</h2>
        <Link href="/marketplace" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-primary hover:underline">
          All products <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {categories.map((category) => (
          <Link key={category.id} href={`/marketplace?category=${encodeURIComponent(category.slug)}`} className="group flex min-h-32 flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card p-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground">
              <CategoryIcon slug={category.slug} />
            </span>
            <span className="text-sm font-semibold leading-tight text-foreground">{category.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function HomeFeaturedVendors({ vendors }: { vendors: FeaturedVendor[] }) {
  if (vendors.length === 0) return null;

  return (
    <section className="space-y-4" aria-labelledby="home-vendors-heading">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="home-vendors-heading" className="font-heading text-xl font-bold sm:text-2xl">Featured vendors</h2>
            <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">Featured</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Approved sellers from verified Benin City markets</p>
        </div>
        <Link href="/vendors" className="inline-flex min-h-11 shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline">
          View all <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
      <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
        {vendors.map((vendor) => (
          <Card key={vendor.id} className="flex w-[min(82vw,19rem)] shrink-0 snap-start flex-col gap-4 rounded-2xl p-5 shadow-sm sm:w-80">
            <div className="flex items-start gap-3">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Store aria-hidden="true" className="size-5" />
              </span>
              <div className="min-w-0">
                <h3 className="line-clamp-1 font-heading text-base font-bold">{vendor.shopName}</h3>
                <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin aria-hidden="true" className="size-4 shrink-0 text-primary" />
                  <span className="line-clamp-1">{vendor.marketName} · {vendor.marketArea}</span>
                </p>
              </div>
            </div>
            {vendor.description && <p className="line-clamp-2 min-h-10 text-sm leading-relaxed text-muted-foreground">{vendor.description}</p>}
            <Button asChild variant="outline" className="mt-auto min-h-12 rounded-xl border-primary/40 font-semibold text-primary">
              <Link href={`/marketplace?vendor=${encodeURIComponent(vendor.slug)}`}>View shop products</Link>
            </Button>
          </Card>
        ))}
      </div>
    </section>
  );
}

function publicProductImage(product: MarketplaceProduct) {
  const vendorImage = product.imageUrl?.startsWith("/") && !product.imageUrl.startsWith("//")
    ? product.imageUrl
    : null;
  const sampleImage = demoProductImage(product.slug);
  return { src: vendorImage ?? sampleImage ?? "/images/product-placeholder.svg", isSample: !vendorImage && sampleImage !== null };
}

export function HomeProducts({ products }: { products: MarketplaceProduct[] }) {
  return (
    <section className="space-y-4" aria-labelledby="home-products-heading">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 id="home-products-heading" className="font-heading text-xl font-bold sm:text-2xl">Featured products</h2>
          <p className="mt-1 text-sm text-muted-foreground">Real products and real Naira prices from verified Benin City market vendors.</p>
        </div>
        <Link href="/marketplace" className="inline-flex min-h-11 shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline">
          All products <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
      {products.length === 0 ? (
        <Card className="rounded-2xl border-dashed p-6 text-center text-muted-foreground">
          No products are available right now. Browse the marketplace for updates.
          <Link href="/marketplace" className="mt-2 inline-flex min-h-11 items-center justify-center font-semibold text-primary">Go to marketplace</Link>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {products.slice(0, 8).map((product) => {
            const image = publicProductImage(product);
            const marketplaceUrl = `/marketplace?q=${encodeURIComponent(product.name)}`;
            return (
              <Card key={product.id} className="overflow-hidden rounded-2xl border-border shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <Link href={marketplaceUrl} className="block focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                  <div className="relative aspect-square bg-muted">
                    <Image src={image.src} alt={image.isSample ? `Sample photo for ${product.name}` : `Photo of ${product.name}`} fill sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 250px" className="object-cover" />
                    {image.isSample && <span className="absolute left-2 top-2 rounded-full bg-card/95 px-2 py-1 text-[11px] font-medium text-foreground shadow-sm">Sample photo</span>}
                  </div>
                </Link>
                <div className="flex min-h-32 flex-col p-3 sm:p-4">
                  <p className="line-clamp-1 text-xs text-muted-foreground">{product.categoryName} · {product.vendorShopName}</p>
                  <Link href={marketplaceUrl} className="mt-1 line-clamp-2 min-h-10 font-semibold leading-snug hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">{product.name}</Link>
                  <div className="mt-auto flex items-end justify-between gap-2 pt-3">
                    <span className="font-heading text-base font-bold text-primary sm:text-lg">{formatNaira(product.priceKobo)}</span>
                    {product.stockQuantity > 0 ? (
                      <Button asChild size="icon" aria-label={`View ${product.name} in marketplace`} title={`View ${product.name} in marketplace`} className="size-11 shrink-0 rounded-full">
                        <Link href={marketplaceUrl}><Plus aria-hidden="true" className="size-5" /></Link>
                      </Button>
                    ) : (
                      <Button size="icon" aria-label={`${product.name} is out of stock`} title="Out of stock" disabled className="size-11 shrink-0 rounded-full">
                        <span className="text-[10px]">Out</span>
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}

export function HomeSectionsLoading() {
  return (
    <div role="status" aria-live="polite" className="flex min-h-24 items-center justify-center rounded-2xl border border-border bg-card px-4 text-center text-sm text-muted-foreground shadow-sm">
      Loading market categories, vendors, and products…
    </div>
  );
}

export function HomeMobileNavigation() {
  const links = [
    { href: "/", label: "Home", Icon: House, current: true },
    { href: "/marketplace", label: "Marketplace", Icon: Store },
    { href: "/orders", label: "Orders", Icon: ClipboardList },
    { href: "/buyer", label: "Profile", Icon: UserRound },
  ];

  return (
    <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 shadow-[0_-4px_20px_rgba(31,27,22,0.08)] backdrop-blur sm:hidden">
      <ul className="mx-auto grid max-w-lg grid-cols-4">
        {links.map(({ href, label, Icon, current }) => (
          <li key={href}>
            <Link href={href} aria-current={current ? "page" : undefined} className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-xs font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${current ? "text-primary" : "text-muted-foreground hover:text-primary"}`}>
              <Icon aria-hidden="true" className="size-5" />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
