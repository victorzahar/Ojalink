import { AdminSectionPlaceholder } from "@/components/admin/admin-section-placeholder";
import { requireRole } from "@/lib/auth/guard";

export const instant = false;

export default async function AdminStatsPage() {
  await requireRole("admin");

  return (
    <AdminSectionPlaceholder
      title="Stats"
      description="Review OjaLink platform activity."
    />
  );
}
