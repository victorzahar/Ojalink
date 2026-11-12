import type { Metadata } from "next";
import Link from "next/link";
import { asc, eq } from "drizzle-orm";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LogoutButton } from "@/components/auth/logout-button";
import { VendorApplyForm } from "@/components/vendor/vendor-apply-form";
import { requireRole } from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import { markets, vendors } from "@/lib/db/schema";

// This page reads the session and application state on every request. Block on
// the server so protected content is never served from the static shell.
export const instant = false;

export const metadata: Metadata = {
  title: "Vendor application · OjaLink",
  description: "Apply to open a shop on OjaLink.",
};

async function applicationStatusCard(status: "pending" | "approved" | "rejected") {
  const copy = {
    pending: {
      title: "Application under review",
      body: "Your shop application is waiting for an admin to review it. You will get vendor access once it is approved.",
    },
    approved: {
      title: "Application approved",
      body: "Your shop is approved. Head to your vendor area to start selling.",
    },
    rejected: {
      title: "Application rejected",
      body: "Your previous vendor application was not approved by an admin. You can update your shop details and verification documents to apply again.",
    },
  }[status];

  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-base font-semibold text-foreground">{copy.title}</p>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            status === "approved"
              ? "bg-green-100 text-green-900"
              : status === "rejected"
              ? "bg-red-100 text-red-900"
              : "bg-amber-100 text-amber-900"
          }`}>
            {status.toUpperCase()}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{copy.body}</p>
        {status === "approved" && (
          <Button asChild className="w-full">
            <Link href="/vendor">Go to vendor area</Link>
          </Button>
        )}
        {status === "rejected" && (
          <Button asChild className="w-full">
            <Link href="/vendor/apply?reapply=true">Update documents and apply again</Link>
          </Button>
        )}
        <Button asChild variant="outline" className="w-full">
          <Link href="/marketplace">Back to marketplace</Link>
        </Button>
        <LogoutButton className="w-full sm:w-auto" />
      </CardContent>
    </Card>
  );
}

export default async function VendorApplyPage({
  searchParams,
}: {
  searchParams?: Promise<{ reapply?: string }>;
}) {
  const user = await requireRole("buyer");
  const db = getDb();
  const query = searchParams ? await searchParams : {};
  const isReapplying = query.reapply === "true";

  if (user.role === "admin") {
    return (
      <main className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center gap-6 px-4 py-8">
        <Card size="sm">
          <CardContent className="flex flex-col gap-4">
            <p className="text-base font-medium text-foreground">Admins do not apply</p>
            <p className="text-sm text-muted-foreground">
              You can grant vendor access to any account from the admin Users page.
            </p>
            <Button asChild className="w-full">
              <Link href="/admin/users">Open Users</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const [existingVendor] = await db
    .select({ approvalStatus: vendors.approvalStatus })
    .from(vendors)
    .where(eq(vendors.userId, user.id))
    .limit(1);

  if (existingVendor && (!isReapplying || existingVendor.approvalStatus !== "rejected")) {
    return (
      <main className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center gap-6 px-4 py-8">
        {await applicationStatusCard(existingVendor.approvalStatus)}
      </main>
    );
  }

  const marketOptions = await db
    .select({ name: markets.name, slug: markets.slug, area: markets.area })
    .from(markets)
    .orderBy(asc(markets.name));

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-xl flex-col justify-center gap-6 px-4 py-8">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Become a vendor</p>
        <h1 className="font-heading text-[28px] leading-tight font-bold text-foreground">
          {existingVendor?.approvalStatus === "rejected" ? "Update Vendor Application" : "Open a shop on OjaLink"}
        </h1>
        <p className="mt-1 text-base text-muted-foreground">
          Applying as {user.email}
        </p>
      </div>

      {existingVendor?.approvalStatus === "rejected" && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950">
          <strong>Previous application rejected:</strong> Please review and update your identity, photos, and guarantor details below to re-submit for review.
        </div>
      )}

      <VendorApplyForm markets={marketOptions} />
    </main>
  );
}
