import { desc, eq } from "drizzle-orm";

import { AdminDisputeList } from "@/components/admin/admin-dispute-list";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { requireRole } from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import { disputes, users } from "@/lib/db/schema";

export const instant = false;

export default async function AdminDisputesPage() {
  await requireRole("admin");

  const disputeRows = await getDb()
    .select({
      id: disputes.id,
      orderId: disputes.orderId,
      reason: disputes.reason,
      status: disputes.status,
      raisedBy: users.name,
      createdAt: disputes.createdAt,
    })
    .from(disputes)
    .innerJoin(users, eq(disputes.raisedBy, users.id))
    .orderBy(desc(disputes.createdAt));

  return (
    <AdminPageShell
      title="Disputes"
      description="Review buyer reports about orders from OjaLink markets in Benin City."
    >
      <AdminDisputeList disputes={disputeRows} />
    </AdminPageShell>
  );
}
