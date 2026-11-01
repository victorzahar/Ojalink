import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/guard";

export const instant = false;

export default async function AdminPage() {
  await requireRole("admin");
  redirect("/admin/vendors");
}
