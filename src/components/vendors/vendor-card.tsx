import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { VerifiedBadge } from "@/components/vendors/verified-badge";

type VendorCardProps = {
  vendor: {
    slug: string;
    shopName: string;
    marketName: string;
    marketArea: string;
    isVerified: boolean;
    averageRating: number | null;
    reviewCount: number;
    products: { name: string; imageUrl: string | null }[];
  };
};

export function VendorCard({ vendor }: VendorCardProps) {
  return (
    <Card className="h-full gap-4">
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <CardTitle className="break-words text-lg font-bold">{vendor.shopName}</CardTitle>
            <CardDescription className="mt-1">
              {vendor.marketName} · {vendor.marketArea}
            </CardDescription>
          </div>
          {vendor.isVerified && <VerifiedBadge />}
        </div>
        <p
          className="flex min-h-6 items-center gap-2 text-sm font-medium"
          aria-label={
            vendor.averageRating === null
              ? "No reviews yet"
              : `Average rating ${vendor.averageRating.toFixed(1)} out of 5 from ${vendor.reviewCount} delivered-order reviews`
          }
        >
          {vendor.averageRating === null ? (
            "No reviews yet"
          ) : (
            <>
              <Star aria-hidden="true" className="size-4 fill-accent text-accent" />
              <span>{vendor.averageRating.toFixed(1)} ({vendor.reviewCount} reviews)</span>
            </>
          )}
        </p>
      </CardHeader>
      {vendor.products.length > 0 && (
        <CardContent className="grid grid-cols-3 gap-2">
          {vendor.products.slice(0, 3).map((product, index) => (
            <Image
              key={`${product.name}-${index}`}
              src={product.imageUrl ?? "/images/product-placeholder.svg"}
              alt={`Product thumbnail: ${product.name}`}
              width={800}
              height={800}
              className="aspect-square w-full rounded-md border border-border object-cover"
            />
          ))}
        </CardContent>
      )}
      <div className="mt-auto px-4 pb-4">
        <Button asChild variant="outline" className="w-full">
          <Link href={`/vendors/${vendor.slug}`}>View shop</Link>
        </Button>
      </div>
    </Card>
  );
}
