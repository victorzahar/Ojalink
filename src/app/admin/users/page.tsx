import { AdminSectionPlaceholder } from "@/components/admin/admin-section-placeholder";
import { requireRole } from "@/lib/auth/guard";

export const instant = false;

export default async function AdminUsersPage() {
  await requireRole("admin");

  return (
    <AdminSectionPlaceholder
      title="Users"
      description="Find and inspect user accounts."
    />
  );
}
