import { desc } from "drizzle-orm";

import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { AdminUserList } from "@/components/admin/admin-user-list";
import { requireRole } from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";

export const instant = false;

export default async function AdminUsersPage() {
  await requireRole("admin");

  const accounts = await getDb()
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  return (
    <AdminPageShell
      title="Users"
      description="Find and inspect OjaLink buyer, vendor, rider and admin accounts."
    >
      <AdminUserList users={accounts} />
    </AdminPageShell>
  );
}
