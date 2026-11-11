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
      body: "Your rider application is waiting for an admin to review it. You will get rider access once it is approved.",
    },
    approved: {
      title: "Application approved",
      body: "You are approved to deliver. Head to your rider area to pick up jobs.",
    },
    rejected: {
      title: "Application not approved",
      body: "An admin reviewed your application and did not approve it. Contact an admin if you think this is a mistake.",
    },
  }[status];

  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-4">
        <p className="text-base font-medium text-foreground">{copy.title}</p>
        <p className="text-sm text-muted-foreground">{copy.body}</p>
        {status === "approved" && (
          <Button asChild className="w-full">
            <Link href="/rider">Go to rider area</Link>
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

export default async function RiderApplyPage() {
  const user = await requireRole("buyer");
  const db = getDb();

  if (user.role === "admin") {
    return (
      <main className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center gap-6 px-4 py-8">
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

  if (existingRequest) {
    return (
      <main className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center gap-6 px-4 py-8">
        {await applicationStatusCard(existingRequest.status)}
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center gap-6 px-4 py-8">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Become a rider</p>
        <h1 className="font-heading text-[28px] leading-tight font-bold text-foreground">
          Deliver orders on OjaLink
        </h1>
        <p className="mt-1 text-base text-muted-foreground">
          Applying as {user.email}
        </p>
      </div>
      <RiderApplyForm contactPhone={user.phone || "Not provided"} />
    </main>
  );
}
