import { AdminSectionPlaceholder } from "@/components/admin/admin-section-placeholder";
import { requireRole } from "@/lib/auth/guard";

export const instant = false;

export default async function AdminDisputesPage() {
  await requireRole("admin");

  return (
    <AdminSectionPlaceholder
      title="Disputes"
      description="Review reports about OjaLink orders."
    />
  );
}
