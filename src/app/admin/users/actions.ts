"use server";

import { revalidatePath } from "next/cache";

import { isUserRole } from "@/lib/auth/role-home";
import { requireRole } from "@/lib/auth/guard";
import { setUserRoleAsAdmin } from "@/lib/auth/roles";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type UpdateUserRoleResult =
  | { ok: true; message: string }
  | { ok: false; message: string; status?: number };

export async function updateUserRole(
  userId: unknown,
  requestedRole: unknown,
): Promise<UpdateUserRoleResult> {
  const auth = await requireRole({ api: true }, "admin");
  if (auth instanceof Response) {
    const body = (await auth.json()) as { error?: string };
    return {
      ok: false,
      status: auth.status,
      message: body.error ?? "You do not have access.",
    };
  }

  if (typeof userId !== "string" || !uuidPattern.test(userId)) {
    return { ok: false, message: "That user could not be found." };
  }

  if (typeof requestedRole !== "string" || !isUserRole(requestedRole)) {
    return { ok: false, message: "Choose a valid role." };
  }

  if (userId === auth.id) {
    return {
      ok: false,
      message: "You cannot change your own role. Ask another admin if needed.",
    };
  }

  try {
    await setUserRoleAsAdmin({
      actorId: auth.id,
      userId,
      role: requestedRole,
    });

    revalidatePath("/admin/users");
    revalidatePath("/vendor/apply");

    return { ok: true, message: `Role updated to ${requestedRole}.` };
  } catch {
    return {
      ok: false,
      message: "Could not update this role. Please try again.",
    };
  }
}
