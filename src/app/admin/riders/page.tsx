import { desc, eq } from "drizzle-orm";

import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { AdminRiderRequestList } from "@/components/admin/admin-rider-request-list";
import { requireRole } from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import { roleRequests, users } from "@/lib/db/schema";

export const instant = false;

const statusPriority = {
  pending: 0,
  approved: 1,
  rejected: 2,
} as const;

export default async function AdminRidersPage() {
  await requireRole("admin");

  const requestRows = await getDb()
    .select({
      id: roleRequests.id,
      userId: roleRequests.userId,
      status: roleRequests.status,
      note: roleRequests.note,
      createdAt: roleRequests.createdAt,
      applicantName: users.name,
      applicantEmail: users.email,
      phone: users.phone,
      applicantImage: users.image,
    })
    .from(roleRequests)
    .innerJoin(users, eq(roleRequests.userId, users.id))
    .orderBy(desc(roleRequests.createdAt));

  const orderedRequests = requestRows.sort((left, right) => {
    const statusDifference =
      statusPriority[left.status] - statusPriority[right.status];
    return statusDifference || right.createdAt.getTime() - left.createdAt.getTime();
  });

  return (
    <AdminPageShell
      title="Rider requests"
      description="Review buyer applications to deliver orders on OjaLink, including guarantor letter, vehicle details, and signature checks."
    >
      <AdminRiderRequestList requests={orderedRequests} />
    </AdminPageShell>
  );
}
