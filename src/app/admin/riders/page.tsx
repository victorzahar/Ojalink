import { desc, eq, inArray } from "drizzle-orm";

import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { AdminRiderRequestList } from "@/components/admin/admin-rider-request-list";
import { requireRole } from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import { guarantors, riders, roleRequests, users } from "@/lib/db/schema";

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
    })
    .from(roleRequests)
    .innerJoin(users, eq(roleRequests.userId, users.id))
    .orderBy(desc(roleRequests.createdAt));

  const orderedRequests = requestRows.sort((left, right) => {
    const statusDifference =
      statusPriority[left.status] - statusPriority[right.status];
    return statusDifference || right.createdAt.getTime() - left.createdAt.getTime();
  });

  // Rider profiles and guarantors for the applicants shown, keyed by user id.
  const applicantIds = orderedRequests.map((request) => request.userId);
  const [riderRows, guarantorRows] =
    applicantIds.length > 0
      ? await Promise.all([
          getDb()
            .select({
              userId: riders.userId,
              vehicleType: riders.vehicleType,
              plateNumber: riders.plateNumber,
              homeMapPin: riders.homeMapPin,
              emergencyContactName: riders.emergencyContactName,
              emergencyContactPhone: riders.emergencyContactPhone,
            })
            .from(riders)
            .where(inArray(riders.userId, applicantIds)),
          getDb()
            .select({
              userId: guarantors.userId,
              name: guarantors.name,
              phone: guarantors.phone,
              relation: guarantors.relation,
              outcome: guarantors.outcome,
              callNote: guarantors.callNote,
            })
            .from(guarantors)
            .where(inArray(guarantors.userId, applicantIds)),
        ])
      : [[], []];

  const riderByUserId = new Map(riderRows.map((row) => [row.userId, row]));
  const guarantorsByUserId = new Map<string, typeof guarantorRows>();
  for (const guarantor of guarantorRows) {
    const list = guarantorsByUserId.get(guarantor.userId) ?? [];
    list.push(guarantor);
    guarantorsByUserId.set(guarantor.userId, list);
  }

  const requests = orderedRequests.map((request) => ({
    ...request,
    rider: riderByUserId.get(request.userId) ?? null,
    guarantors: guarantorsByUserId.get(request.userId) ?? [],
  }));

  return (
    <AdminPageShell
      title="Rider requests"
      description="Review buyer applications to deliver orders on OjaLink. Check the vehicle, emergency contact and guarantor calls before approving."
    >
      <AdminRiderRequestList requests={requests} />
    </AdminPageShell>
  );
}
