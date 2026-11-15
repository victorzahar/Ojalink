import { desc, eq } from "drizzle-orm";

import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { AdminGuarantorCalls } from "@/components/admin/admin-guarantor-calls";
import { AdminVerificationQueue } from "@/components/admin/admin-verification-queue";
import { requireRole } from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import { guarantors, identityVerifications } from "@/lib/db/schema";
import { users } from "@/lib/auth/schema";

export const instant = false;

const statusPriority = {
  pending: 0,
  verified: 1,
  failed: 2,
} as const;

export default async function AdminVerificationsPage() {
  await requireRole("admin");

  const db = getDb();
  const [verificationRows, guarantorRows] = await Promise.all([
    db
      .select({
        id: identityVerifications.id,
        kind: identityVerifications.kind,
        status: identityVerifications.status,
        provider: identityVerifications.provider,
        providerRef: identityVerifications.providerRef,
        note: identityVerifications.note,
        attempts: identityVerifications.attempts,
        createdAt: identityVerifications.createdAt,
        reviewedAt: identityVerifications.reviewedAt,
        applicantName: users.name,
        applicantEmail: users.email,
      })
      .from(identityVerifications)
      .innerJoin(users, eq(identityVerifications.userId, users.id))
      .orderBy(desc(identityVerifications.createdAt)),
    db
      .select({
        id: guarantors.id,
        name: guarantors.name,
        phone: guarantors.phone,
        relation: guarantors.relation,
        outcome: guarantors.outcome,
        callNote: guarantors.callNote,
        createdAt: guarantors.createdAt,
        applicantName: users.name,
        applicantEmail: users.email,
      })
      .from(guarantors)
      .innerJoin(users, eq(guarantors.userId, users.id))
      .orderBy(desc(guarantors.createdAt)),
  ]);

  const orderedVerifications = verificationRows.sort(
    (left, right) => statusPriority[left.status] - statusPriority[right.status],
  );
  const orderedGuarantors = guarantorRows.sort((left, right) => {
    const leftPending = left.outcome === "pending" ? 0 : 1;
    const rightPending = right.outcome === "pending" ? 0 : 1;
    return leftPending - rightPending;
  });

  return (
    <AdminPageShell
      title="Verifications"
      description="Phone OTP, identity checks and bank account verifications. The queue shows statuses and references only — document data lives with the verification provider, never here."
    >
      <AdminVerificationQueue verifications={orderedVerifications} />
      <AdminGuarantorCalls guarantors={orderedGuarantors} />
    </AdminPageShell>
  );
}
