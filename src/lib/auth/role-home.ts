/**
 * Client-safe role helpers — no database imports, so bundling this in the
 * browser stays small. Keep the list in sync with the `user_role` enum in
 * the database (see src/lib/auth/role.ts).
 */
export const userRoles = ["buyer", "vendor", "rider", "admin"] as const;

export type UserRole = (typeof userRoles)[number];

/** After login every role goes to its own area. Unknown roles get no home. */
export const roleHome: Record<UserRole, `/${UserRole}`> = {
  buyer: "/buyer",
  vendor: "/vendor",
  rider: "/rider",
  admin: "/admin",
};

/** True only for known roles — unknown or missing roles mean no access. */
export function isUserRole(role: string | null | undefined): role is UserRole {
  return typeof role === "string" && (userRoles as readonly string[]).includes(role);
}
