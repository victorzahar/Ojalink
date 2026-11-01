import { AdminSectionPlaceholder } from "@/components/admin/admin-section-placeholder";
import { requireRole } from "@/lib/auth/guard";

export const instant = false;

export default async function AdminVendorsPage() {
  await requireRole("admin");

  return (
    <AdminSectionPlaceholder
      title="Vendor approvals"
      description="Review vendors waiting for approval."
    />
  );
}
