import { Suspense } from "react";
import { cacheLife } from "next/cache";

import {
  HomeCategories,
  HomeFeaturedVendors,
  HomeMobileNavigation,
  HomeProducts,
  HomePromoAndSearch,
  HomeSectionsLoading,
  MarketplaceTicker,
} from "@/components/home/home-sections";
import {
  getCategories,
  getFeaturedVendors,
  searchProducts,
} from "@/lib/marketplace/queries";

export const instant = false;

async function HomeDatabaseSections() {
  "use cache";
  cacheLife({ stale: 60, revalidate: 60, expire: 300 });

  const [categories, vendors, products] = await Promise.all([
    getCategories(),
    getFeaturedVendors(6),
    searchProducts({ limit: 8 }),
  ]);

  return (
    <div className="contents">
      <HomeCategories categories={categories} />
      <HomeFeaturedVendors vendors={vendors} />
      <HomeProducts products={products} />
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 pb-28 pt-6 sm:gap-10 sm:px-6 sm:pb-12 sm:pt-10">
        <HomePromoAndSearch />
        <MarketplaceTicker />
        <Suspense fallback={<HomeSectionsLoading />}>
          <HomeDatabaseSections />
        </Suspense>
      </main>
      <HomeMobileNavigation />
    </>
  );
}
