import { forbidden } from "next/navigation";

import { requireRole } from "@/lib/auth/guard";
import { getCurrentUser } from "@/lib/auth/session";

export async function requireCartBuyer() {
  const guardedUser = await requireRole("buyer");
  const currentUser = await getCurrentUser();

  // requireRole permits admins globally; cart access is buyer-only.
  if (
    !currentUser ||
    currentUser.role !== "buyer" ||
    guardedUser.role !== "buyer" ||
    currentUser.id !== guardedUser.id
  ) {
    forbidden();
  }

  return { id: currentUser.id };
}
