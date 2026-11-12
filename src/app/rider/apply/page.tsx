import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LogoutButton } from "@/components/auth/logout-button";
import { RiderApplyForm } from "@/components/rider/rider-apply-form";
import { requireRole } from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import { roleRequests } from "@/lib/db/schema";

// This page reads the session and application state on every request. Block on
// the server so protected content is never served from the static shell.
export const instant = false;

export const metadata: Metadata = {
  title: "Rider application · OjaLink",
  description: "Apply to deliver orders on OjaLink.",
};

async function applicationStatusCard(status: "pending" | "approved" | "rejected") {
  const copy = {
    pending: {
      title: "Application under review",
      body: "Your rider application and guarantor details are waiting for an admin to review them. You will get rider access once approved.",
    },
    approved: {
      title: "Application approved",
      body: "You are approved to deliver on OjaLink. Head to your rider area to pick up delivery jobs.",
    },
    rejected: {
      title: "Application rejected",
      body: "Your previous rider application was not approved by an admin. You can review your vehicle, guarantor, and identity credentials and apply again.",
    },
  }[status];

  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-base font-semibold text-foreground">{copy.title}</p>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              status === "approved"
                ? "bg-green-100 text-green-900"
                : status === "rejected"
                ? "bg-red-100 text-red-900"
                : "bg-amber-100 text-amber-900"
            }`}
          >
            {status.toUpperCase()}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{copy.body}</p>

        {status === "approved" && (
          <Button asChild className="w-full">
            <Link href="/rider">Go to rider area</Link>
          </Button>
        )}

        {status === "rejected" && (
          <Button asChild className="w-full">
            <Link href="/rider/apply?reapply=true">Update documents and apply again</Link>
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

export default async function RiderApplyPage(props: {
  searchParams?: Promise<{ reapply?: string }>;
}) {
  const searchParams = props.searchParams ? await props.searchParams : {};
  const isReapplying = searchParams.reapply === "true";

  const user = await requireRole("buyer");
  const db = getDb();

  if (user.role === "admin") {
    return (
      <main className="mx-auto flex min-h-svh w-full max-w-xl flex-col justify-center gap-6 px-4 py-8">
        <Card size="sm">
          <CardContent className="flex flex-col gap-4">
            <p className="text-base font-medium text-foreground">Admins do not apply</p>
            <p className="text-sm text-muted-foreground">
              You can grant rider access to any account from the admin Users page or the rider requests queue.
            </p>
            <Button asChild className="w-full">
              <Link href="/admin/riders">Open rider requests</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const [existingRequest] = await db
    .select({ status: roleRequests.status })
    .from(roleRequests)
    .where(eq(roleRequests.userId, user.id))
    .limit(1);

  if (existingRequest && (!isReapplying || existingRequest.status !== "rejected")) {
    return (
      <main className="mx-auto flex min-h-svh w-full max-w-xl flex-col justify-center gap-6 px-4 py-8">
        {await applicationStatusCard(existingRequest.status)}
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-xl flex-col justify-center gap-6 px-4 py-8">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Become a rider</p>
        <h1 className="font-heading text-[28px] leading-tight font-bold text-foreground">
          {existingRequest?.status === "rejected" ? "Update Rider Application" : "Deliver orders on OjaLink"}
        </h1>
        <p className="mt-1 text-base text-muted-foreground">
          Applying as {user.email}
        </p>
      </div>

      {existingRequest?.status === "rejected" && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950">
          <strong>Previous application rejected:</strong> Please review and update your vehicle, guarantor, and identity details below to re-submit for review.
        </div>
      )}

      <RiderApplyForm contactPhone={user.phone || ""} isReapply={isReapplying} />
    </main>
  );
}
