"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import { roleRequests } from "@/lib/db/schema";
import { validateRiderApplication } from "@/lib/riders/application";

type SubmitRiderApplicationResult =
  | { ok: true; message: string }
  | { ok: false; message: string; status?: number };

export async function submitRiderApplication(
  formData: FormData,
): Promise<SubmitRiderApplicationResult> {
  const auth = await requireRole({ api: true }, "buyer");
  if (auth instanceof Response) {
    const body = (await auth.json()) as { error?: string };
    return {
      ok: false,
      status: auth.status,
      message: body.error ?? "You do not have access.",
    };
  }

  const application = validateRiderApplication(formData);
  if (!application.success) {
    return {
      ok: false,
      message: "Shorten the note and try again.",
    };
  }

  const db = getDb();

  try {
    const [existingRequest] = await db
      .select({ status: roleRequests.status })
      .from(roleRequests)
      .where(eq(roleRequests.userId, auth.id))
      .limit(1);

    if (existingRequest) {
      return {
        ok: false,
        status: 409,
        message:
          existingRequest.status === "pending"
            ? "Your rider application is already waiting for review."
            : "A rider application for this account already exists.",
      };
    }

    await db.insert(roleRequests).values({
      userId: auth.id,
      requestedRole: "rider",
      note: application.data.note || null,
      status: "pending",
    });

    revalidatePath("/admin/riders");
    revalidatePath("/rider/apply");

    return {
      ok: true,
      message:
        "Application received. An admin will review it and you will get rider access once approved.",
    };
  } catch {
    return {
      ok: false,
      message: "Could not submit this application. Please try again.",
    };
  }
}
