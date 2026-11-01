import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { isUserRole, type UserRole } from "@/lib/auth/role-home";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
};

/**
 * Reads the Better Auth session for the current request, for server code
 * (pages, route handlers, server actions).
 *
 * Returns null when nobody is signed in — and also when the signed-in user's
 * role is missing or unknown (default deny). Reading `await headers()` marks
 * every page that calls this as dynamic, which is intended for auth pages.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const { user, session } = (await auth.api.getSession({ headers: await headers() })) ?? {};
  if (!session || !user) return null;

  const role = user.role as UserRole | undefined;
  if (!isUserRole(role)) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone ?? null,
    role,
  };
}
