/**
 * The role a person chooses when signing up. Every account is still created
 * as a buyer in the database (the server ignores any client-sent role for
 * security); the chosen role only decides what application is filed for
 * admin approval right after the account exists.
 */
export const signupRoles = ["buyer", "vendor", "rider"] as const;

export type SignupRole = (typeof signupRoles)[number];

/** The role from a form value, or null when the value is not one. */
export function parseSignupRole(value: unknown): SignupRole | null {
  return typeof value === "string" && (signupRoles as readonly string[]).includes(value)
    ? (value as SignupRole)
    : null;
}

/**
 * Where a fresh account lands after signing up. A submitted vendor or rider
 * application has its own waiting-for-approval page; everyone else goes to
 * the buyer area.
 */
export function signupLandingPath(role: SignupRole, applicationSubmitted: boolean): string {
  if (applicationSubmitted) {
    if (role === "vendor") return "/vendor/apply";
    if (role === "rider") return "/rider/apply";
  }
  return "/buyer";
}
