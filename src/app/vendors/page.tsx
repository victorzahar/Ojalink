import type { Metadata } from "next";

import { VendorCard } from "@/components/vendors/vendor-card";
import { Card, CardContent } from "@/components/ui/card";
import { getPublicVendorDirectory } from "@/lib/vendors/public-storefront";

export const metadata: Metadata = {
  title: "Vendor shops in Benin City",
  description:
    "Browse verified vendor shops, markets and products from New Benin Market, Oba Market and across Benin City.",
};

export const instant = false;

export default async function VendorsPage() {
  const vendors = await getPublicVendorDirectory();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
      <header className="space-y-2">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Vendor shops in Benin City
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground">
          Browse approved vendors from familiar markets around the city.
        </p>
      </header>

      {vendors.length === 0 ? (
        <Card>
          <CardContent className="py-5 text-base text-muted-foreground">
            No vendor shops are listed yet. Please check back soon.
          </CardContent>
        </Card>
      ) : (
        <section
          aria-label="Approved vendor shops"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {vendors.map((vendor) => <VendorCard key={vendor.slug} vendor={vendor} />)}
        </section>
      )}
    </main>
  );
}
