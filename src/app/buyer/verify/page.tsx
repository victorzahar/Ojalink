import type { Metadata } from "next";
import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";

import { PhoneVerifyForm } from "@/components/buyer/phone-verify-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LogoutButton } from "@/components/auth/logout-button";
import { requireRole } from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import { identityVerifications } from "@/lib/db/schema";
import { users } from "@/lib/auth/schema";
import { OTP_MAX_ATTEMPTS } from "@/lib/verification/otp";

// This page reads the session and verification state on every request. Block on
// the server so protected content is never served from the static shell.
export const instant = false;

export const metadata: Metadata = {
  title: "Verify your phone · OjaLink",
  description: "Verify your phone number to start ordering on OjaLink.",
};

export default async function BuyerVerifyPage() {
  const user = await requireRole("buyer");

  const db = getDb();
  const [[profile], [verifiedRow]] = await Promise.all([
    db
      .select({ phone: users.phone, phoneVerifiedAt: users.phoneVerifiedAt })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1),
    db
      .select({ id: identityVerifications.id, checkedAt: identityVerifications.checkedAt })
      .from(identityVerifications)
      .where(
        and(
          eq(identityVerifications.userId, user.id),
          eq(identityVerifications.kind, "phone_otp"),
          eq(identityVerifications.status, "verified"),
        ),
      )
      .orderBy(desc(identityVerifications.createdAt))
      .limit(1),
  ]);

  const alreadyVerified = Boolean(profile?.phoneVerifiedAt) || Boolean(verifiedRow);

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-md items-center justify-between px-4 py-4">
          <Link
            className="inline-flex min-h-11 items-center rounded-md text-lg font-bold text-primary focus-visible:outline"
            href="/buyer"
          >
            OjaLink
          </Link>
          <LogoutButton />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8">
        {alreadyVerified ? (
          <Card>
            <CardHeader>
              <CardTitle>Phone verified ✓</CardTitle>
              <CardDescription>
                {profile?.phone ?? user.phone ?? "Your number"} is verified. You can place orders
                within your verification limits.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/buyer">Back to buyer area</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Verify your phone number</CardTitle>
                <CardDescription>
                  New accounts can browse the marketplace. Verifying your phone unlocks ordering,
                  with a ₦100,000 limit per order. Verifying your identity later raises it.
                </CardDescription>
              </CardHeader>
            </Card>
            <PhoneVerifyForm
              defaultPhone={profile?.phone ?? user.phone ?? ""}
              maxAttempts={OTP_MAX_ATTEMPTS}
            />
          </>
        )}
      </main>
    </div>
  );
}
