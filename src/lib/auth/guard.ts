import { forbidden, redirect } from "next/navigation";

import type { UserRole } from "@/lib/auth/role-home";
import { getCurrentUser, type CurrentUser } from "@/lib/auth/session";

/** Marks API/server-action usage: failures come back as JSON, never redirects. */
type ApiMode = { api: true };

/**
 * Page and server-action guard.
 *
 * - Not signed in (or no usable role) → redirect to /login
 * - Wrong role → 403 page "You do not have access" (never names other areas)
 * - Admin passes every check
 * - Unknown or missing role never passes (getCurrentUser returns null for it)
 *
 * Usage:
 *   const user = await requireRole("buyer");              // server component
 *   const auth = await requireRole({ api: true }, "admin"); // API route / action
 */
export async function requireRole(...roles: UserRole[]): Promise<CurrentUser>;
export async function requireRole(
  mode: ApiMode,
  ...roles: UserRole[]
): Promise<CurrentUser | Response>;
export async function requireRole(
  ...args: [ApiMode, ...UserRole[]] | UserRole[]
): Promise<CurrentUser | Response> {
  const apiMode = typeof args[0] === "object" && args[0] !== null && args[0].api === true;
  const roles = (apiMode ? args.slice(1) : args) as UserRole[];

  const user = await getCurrentUser();

  if (!user) {
    if (apiMode) {
      return Response.json({ error: "Not signed in" }, { status: 401 });
    }
    redirect("/login");
  }

  // Admin passes every check; everyone else must hold one of the allowed roles.
  const allowed = user.role === "admin" || roles.includes(user.role);
  if (!allowed) {
    if (apiMode) {
      return Response.json({ error: "You do not have access" }, { status: 403 });
    }
    forbidden();
  }

  return user;
}
