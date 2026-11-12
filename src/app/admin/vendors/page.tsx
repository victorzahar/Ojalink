import { existsSync } from "node:fs";
import { join } from "node:path";

import { desc, eq } from "drizzle-orm";

import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { AdminVendorApprovalList } from "@/components/admin/admin-vendor-approval-list";
import { requireRole } from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import { markets, users, vendors } from "@/lib/db/schema";

export const instant = false;

const statusPriority = {
  pending: 0,
  approved: 1,
  rejected: 2,
} as const;

export default async function AdminVendorsPage() {
  await requireRole("admin");

  const vendorRows = await getDb()
    .select({
      id: vendors.id,
      shopName: vendors.shopName,
      slug: vendors.slug,
      shopImageUrl: vendors.shopImageUrl,
      approvalStatus: vendors.approvalStatus,
      description: vendors.description,
      createdAt: vendors.createdAt,
      phone: users.phone,
      ownerName: users.name,
      portraitUrl: users.image,
      marketName: markets.name,
      marketArea: markets.area,
    })
    .from(vendors)
    .innerJoin(users, eq(vendors.userId, users.id))
    .innerJoin(markets, eq(vendors.marketId, markets.id))
    .orderBy(desc(vendors.createdAt));

  const portraitPath = "/test-assets/adaeze-vendor-portrait.webp";
  const shopPhotoPath = "/test-assets/adaeze-fabric-stall.webp";
  const showLocalPreview =
    process.env.NODE_ENV === "development" &&
    existsSync(join(process.cwd(), "public", portraitPath.slice(1))) &&
    existsSync(join(process.cwd(), "public", shopPhotoPath.slice(1)));

  const displayVendors = vendorRows.map((vendor) => {
    const isLocalPreview = showLocalPreview && vendor.slug === "adaeze-fabrics";
    return {
      ...vendor,
      ...(isLocalPreview
        ? {
            approvalStatus: "pending" as const,
            portraitUrl: portraitPath,
            shopImageUrl: shopPhotoPath,
          }
        : {}),
      isLocalPreview,
    };
  });

  const orderedVendors = displayVendors.sort((left, right) => {
    const statusDifference =
      statusPriority[left.approvalStatus] - statusPriority[right.approvalStatus];
    return statusDifference || right.createdAt.getTime() - left.createdAt.getTime();
  });

  return (
    <AdminPageShell
      title="Vendor approvals"
      description="Review vendors registered with OjaLink markets in Benin City."
    >
      <AdminVendorApprovalList vendors={orderedVendors} />
    </AdminPageShell>
  );
}
