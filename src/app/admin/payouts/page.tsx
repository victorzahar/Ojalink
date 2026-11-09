import { asc, desc, eq } from "drizzle-orm";

import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { AdminPayoutList } from "@/components/admin/admin-payout-list";
import { requireRole } from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import { payouts, vendors } from "@/lib/db/schema";

export const instant = false;

export default async function AdminPayoutsPage() {
  await requireRole("admin");

  const payoutRows = await getDb()
    .select({
      id: payouts.id,
      vendorName: vendors.shopName,
      weekStart: payouts.weekStart,
      amountKobo: payouts.amountKobo,
      status: payouts.status,
      paidAt: payouts.paidAt,
    })
    .from(payouts)
    .innerJoin(vendors, eq(payouts.vendorId, vendors.id))
    .orderBy(desc(payouts.weekStart), asc(vendors.shopName));

  const pendingTotalKobo = payoutRows.reduce(
    (total, payout) =>
      payout.status === "unpaid" ? total + payout.amountKobo : total,
    0,
  );

  return (
    <AdminPageShell
      title="Payouts"
      description="Review weekly vendor payouts and their payment status."
    >
      <AdminPayoutList
        payouts={payoutRows}
        pendingTotalKobo={pendingTotalKobo}
      />
    </AdminPageShell>
  );
}
