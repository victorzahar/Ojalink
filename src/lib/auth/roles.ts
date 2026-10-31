import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { userRoles } from "@/lib/auth/role";

export type UserRole = (typeof userRoles)[number];

type SetUserRoleInput = {
  actorId: string;
  userId: string;
  role: UserRole;
};

/** Use only from server-side admin actions after their session has been verified. */
export async function setUserRoleAsAdmin({
  actorId,
  userId,
  role,
}: SetUserRoleInput) {
  const db = getDb();
  const [actor] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, actorId))
    .limit(1);

  if (actor?.role !== "admin") {
    throw new Error("Only an admin can change a user role.");
  }

  await db.update(users).set({ role }).where(eq(users.id, userId));
}
