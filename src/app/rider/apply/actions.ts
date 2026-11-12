"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/guard";
import { users } from "@/lib/auth/schema";
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
      message: application.error ?? "Please check your application details and try again.",
    };
  }

  const db = getDb();

  try {
    const [existingRequest] = await db
      .select({ id: roleRequests.id, status: roleRequests.status })
      .from(roleRequests)
      .where(eq(roleRequests.userId, auth.id))
      .limit(1);

    if (existingRequest && existingRequest.status === "pending") {
      return {
        ok: false,
        status: 409,
        message: "Your rider application is already waiting for review.",
      };
    }

    if (existingRequest && existingRequest.status === "approved") {
      return {
        ok: false,
        status: 409,
        message: "You are already an approved rider. Go to your rider area to view jobs.",
      };
    }

    // Process portrait image upload
    let portraitUrl = application.data.portraitImage || null;
    const portraitFile = formData.get("portrait");
    if (portraitFile instanceof File && portraitFile.size > 0 && portraitFile.size <= 3 * 1024 * 1024) {
      const buffer = Buffer.from(await portraitFile.arrayBuffer());
      portraitUrl = `data:${portraitFile.type || "image/jpeg"};base64,${buffer.toString("base64")}`;
    }

    // Fall back to test portrait in dev if none was uploaded
    if (!portraitUrl && process.env.NODE_ENV === "development") {
      portraitUrl = "/test-assets/adaeze-vendor-portrait.webp";
    }

    // Update user portrait and phone if provided
    const userUpdate: { image?: string; phone?: string } = {};
    if (portraitUrl) userUpdate.image = portraitUrl;
    if (application.data.phone) userUpdate.phone = application.data.phone;
    if (Object.keys(userUpdate).length > 0) {
      await db.update(users).set(userUpdate).where(eq(users.id, auth.id));
    }

    // Construct structured verification metadata in note
    const metaLines: string[] = [];
    if (application.data.vehicleType || application.data.plateNumber || application.data.deliveryZone) {
      metaLines.push(
        `Vehicle: ${application.data.vehicleType || "Motorcycle"} | Plate: ${application.data.plateNumber || "N/A"} | Zone: ${application.data.deliveryZone || "Benin City"}`,
      );
    }
    if (application.data.nin) {
      metaLines.push(`NIN: ${application.data.nin}`);
    }
    if (application.data.emergencyName || application.data.emergencyPhone) {
      metaLines.push(
        `Emergency Contact: ${application.data.emergencyName || ""} (${application.data.emergencyPhone || ""})`,
      );
    }
    if (application.data.bankName && application.data.bankAccountNumber) {
      metaLines.push(
        `Bank: ${application.data.bankName} - ${application.data.bankAccountNumber} (${application.data.bankAccountName || ""})`,
      );
    }
    if (application.data.guarantorName && application.data.guarantorPhone) {
      metaLines.push(
        `Guarantor: ${application.data.guarantorName} - ${application.data.guarantorPhone} (${application.data.guarantorRelationship || "Guarantor"}, ${application.data.guarantorAddress || "Benin City"})`,
      );
    }
    if (application.data.note) {
      metaLines.push(`Availability: ${application.data.note}`);
    }

    const combinedNote = metaLines.length > 0 ? metaLines.join("\n") : application.data.note || null;

    if (existingRequest) {
      // Re-application: update existing request back to pending
      await db
        .update(roleRequests)
        .set({
          status: "pending",
          resolvedBy: null,
          note: combinedNote,
        })
        .where(eq(roleRequests.id, existingRequest.id));
    } else {
      await db.insert(roleRequests).values({
        userId: auth.id,
        requestedRole: "rider",
        note: combinedNote,
        status: "pending",
      });
    }

    revalidatePath("/admin/riders");
    revalidatePath("/rider/apply");
    revalidatePath("/buyer");

    return {
      ok: true,
      message:
        "Application received. An admin will review your verification credentials and guarantor details.",
    };
  } catch {
    return {
      ok: false,
      message: "Could not submit this application. Please try again.",
    };
  }
}
