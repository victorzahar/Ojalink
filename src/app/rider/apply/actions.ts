"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import { guarantors, riders, roleRequests } from "@/lib/db/schema";
import { users } from "@/lib/auth/schema";
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
      message:
        "Check every field: vehicle details, emergency contact, both guarantors and the training acknowledgement.",
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

    // Phone verification is required before applying: admins need a verified
    // number to call the rider about pickups, and guarantors are checked by phone.
    const [user] = await db
      .select({ phoneVerifiedAt: users.phoneVerifiedAt })
      .from(users)
      .where(eq(users.id, auth.id))
      .limit(1);
    if (!user?.phoneVerifiedAt) {
      return {
        ok: false,
        status: 403,
        message: "Verify your phone number first — start from your buyer area verification page.",
      };
    }

    // Rider profile + guarantors + role request all succeed together.
    await db.batch([
      db.insert(riders).values({
        userId: auth.id,
        vehicleType: application.data.vehicleType,
        plateNumber: application.data.plateNumber,
        homeMapPin: application.data.homeMapPin,
        emergencyContactName: application.data.emergencyContactName,
        emergencyContactPhone: application.data.emergencyContactPhone,
      }),
      db.insert(guarantors).values(
        application.data.guarantors.map((guarantor) => ({
          userId: auth.id,
          name: guarantor.name,
          phone: guarantor.phone,
          relation: guarantor.relation,
        })),
      ),
      db.insert(roleRequests).values({
        userId: auth.id,
        requestedRole: "rider",
        note: application.data.note || null,
        status: "pending",
      }),
    ]);

    revalidatePath("/admin/riders");
    revalidatePath("/rider/apply");

    return {
      ok: true,
      message:
        "Application received. An admin will review it and call your guarantors before you get rider access.",
    };
  } catch {
    return {
      ok: false,
      message: "Could not submit this application. Please try again.",
    };
  }
}
