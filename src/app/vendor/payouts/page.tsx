import type { Metadata } from "next";
import Link from "next/link";
import { and, desc, eq, inArray } from "drizzle-orm";
import { Card, CardContent } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import { identityVerifications, orders, vendors } from "@/lib/db/schema";
import { formatNaira } from "@/lib/orders/format";
import { summarisePayouts } from "@/lib/orders/payout-summary";
import { vendorOrdersScope } from "@/lib/orders/vendor-scope";
import { BankVerifyForm } from "@/components/vendor/bank-verify-form";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// This page reads the session on every request. Block on the server so
// protected content is never served from the static shell or a cache.
export const instant = false;

export const metadata: Metadata = {
  title: "Payouts · OjaLink",
  description: "Your weekly OjaLink payout summary.",
};

// Only these statuses count. Everything else counts as nothing.
const COUNTED_STATUSES = ["delivered", "paid", "accepted", "picked_up"] as const;

/** Today's date in Lagos (YYYY-MM-DD), for the payout hold countdown. */
function lagosToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export default async function VendorPayoutsPage() {
  const user = await requireRole("vendor"); // admin also passes

  // The vendor comes from the signed-in user, never from the URL or a form.
  const [vendor] = await getDb()
    .select({ id: vendors.id, payoutHoldUntil: vendors.payoutHoldUntil })
    .from(vendors)
    .where(eq(vendors.userId, user.id));

  if (!vendor) {
    return (
      <main className="mx-auto flex min-h-svh w-full max-w-md flex-col gap-6 px-4 py-8">
        <h1 className="font-heading text-[28px] leading-tight font-bold text-foreground">
          Payouts
        </h1>
        <p className="text-base text-muted-foreground">
          No vendor shop is linked to this account.
        </p>
      </main>
    );
  }

  // Payout gate: a verified bank account is required before OjaLink sends money.
  const [[bankVerified], [latestAttempt]] = await Promise.all([
    getDb()
      .select({ id: identityVerifications.id, checkedAt: identityVerifications.checkedAt })
      .from(identityVerifications)
      .where(
        and(
          eq(identityVerifications.userId, user.id),
          eq(identityVerifications.kind, "bank_account"),
          eq(identityVerifications.status, "verified"),
        ),
      )
      .limit(1),
    getDb()
      .select({
        status: identityVerifications.status,
        note: identityVerifications.note,
        checkedAt: identityVerifications.checkedAt,
      })
      .from(identityVerifications)
      .where(
        and(
          eq(identityVerifications.userId, user.id),
          eq(identityVerifications.kind, "bank_account"),
        ),
      )
      .orderBy(desc(identityVerifications.createdAt))
      .limit(1),
  ]);

  const bankAccountVerified = Boolean(bankVerified);
  const payoutHoldActive = Boolean(
    vendor.payoutHoldUntil && vendor.payoutHoldUntil >= lagosToday(),
  );

  // Only this vendor's orders, only the statuses that count.
  const rows = await getDb()
    .select({
      status: orders.status,
      subtotalKobo: orders.subtotalKobo,
      platformFeeKobo: orders.platformFeeKobo,
      refundKobo: orders.refundKobo,
      deliveredAt: orders.deliveredAt,
    })
    .from(orders)
    .where(
      and(
        vendorOrdersScope(vendor.id),
        inArray(orders.status, COUNTED_STATUSES),
      ),
    );

  const summary = summarisePayouts(rows);

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col gap-6 px-4 py-8">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Vendor area</p>
        <h1 className="font-heading text-[28px] leading-tight font-bold text-foreground">
          Payouts
        </h1>
        <p className="mt-1 text-base text-muted-foreground">
          Weeks run Monday to Sunday, Lagos time.
        </p>
      </div>

      {payoutHoldActive && (
        <div className="rounded-md bg-amber-100 px-3 py-2 text-sm text-amber-900">
          <p className="font-medium">First payout held</p>
          <p>
            Your first weekly payout is held until {vendor.payoutHoldUntil} (Lagos date) while your
            first sales settle. This is standard for new vendors.
          </p>
        </div>
      )}

      {bankAccountVerified ? (
        <Card size="sm">
          <CardContent className="flex flex-col gap-1">
            <p className="text-sm font-medium text-green-900">
              Payout account verified ✓
            </p>
            <p className="text-sm text-muted-foreground">
              Weekly payouts go to your verified bank account. Contact an admin to change it.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-base">Verify your payout account</CardTitle>
            <CardDescription>
              OjaLink only sends money to a bank account we have confirmed belongs to you. Verify
              yours once and payouts flow weekly after that.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {latestAttempt?.status === "failed" && latestAttempt.note && (
              <p className="mb-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                Last attempt: {latestAttempt.note}
              </p>
            )}
            <BankVerifyForm profileName={user.name} />
          </CardContent>
        </Card>
      )}

      <Card size="sm">
        <CardContent className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">
            Pending (not yet delivered)
          </p>
          <p className="text-2xl font-bold text-foreground">
            {formatNaira(summary.pendingKobo)}
          </p>
        </CardContent>
      </Card>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-foreground">Earned by week</h2>
        {summary.weeks.length === 0 ? (
          <p className="text-base text-muted-foreground">
            No delivered orders yet.
          </p>
        ) : (
          summary.weeks.map((week) => (
            <Card key={week.weekStart} size="sm">
              <CardContent className="flex flex-col gap-1">
                <p className="text-sm text-muted-foreground">
                  Week starting {week.weekStart} · {week.orderCount}{" "}
                  {week.orderCount === 1 ? "order" : "orders"}
                </p>
                <p className="text-xl font-bold text-foreground">
                  {formatNaira(week.earnedKobo)}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </section>

      <Link
        href="/vendor"
        className="inline-flex min-h-11 items-center font-medium text-primary underline-offset-4 hover:underline"
      >
        ← Back to vendor area
      </Link>
    </main>
  );
}
