import { forbidden, redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";
import { canManageVendorProducts } from "@/lib/vendor-products/validation";

export async function requireVendorUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  // requireRole("vendor") also allows administrators; this feature is vendor-only.
  if (!canManageVendorProducts(user.role)) forbidden();
  return user;
}
