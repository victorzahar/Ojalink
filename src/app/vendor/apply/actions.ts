"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/guard";
import { users } from "@/lib/auth/schema";
import { getDb } from "@/lib/db";
import { markets, vendors } from "@/lib/db/schema";
import {
  validateVendorApplication,
  vendorSlugCandidates,
} from "@/lib/vendors/application";

type SubmitApplicationResult =
  | { ok: true; message: string }
  | { ok: false; message: string; status?: number };

export async function submitVendorApplication(
  formData: FormData,
): Promise<SubmitApplicationResult> {
  const auth = await requireRole({ api: true }, "buyer");
  if (auth instanceof Response) {
    const body = (await auth.json()) as { error?: string };
    return {
      ok: false,
      status: auth.status,
      message: body.error ?? "You do not have access.",
    };
  }

  const application = validateVendorApplication(formData);
  if (!application.success) {
    return {
      ok: false,
      message: "Check the shop name, description and market, then try again.",
    };
  }

  const db = getDb();

  try {
    const [existingVendor] = await db
      .select({ id: vendors.id, approvalStatus: vendors.approvalStatus })
      .from(vendors)
      .where(eq(vendors.userId, auth.id))
      .limit(1);

    if (existingVendor) {
      return {
        ok: false,
        status: 409,
        message:
          existingVendor.approvalStatus === "pending"
            ? "Your application is already waiting for review."
            : "An application for this account already exists.",
      };
    }

    const [market] = await db
      .select({ id: markets.id })
      .from(markets)
      .where(eq(markets.slug, application.data.marketSlug))
      .limit(1);

    if (!market) {
      return { ok: false, message: "Choose a valid market." };
    }

    const candidates = vendorSlugCandidates(application.data.shopName);
    let chosenSlug: string | undefined;
    for (const candidate of candidates) {
      const [taken] = await db
        .select({ id: vendors.id })
        .from(vendors)
        .where(eq(vendors.slug, candidate))
        .limit(1);
      if (!taken) {
        chosenSlug = candidate;
        break;
      }
    }

    if (!chosenSlug) {
      return {
        ok: false,
        message: "All shop address variants are taken. Try a different shop name.",
      };
    }

    // Process photo uploads or URLs
    let portraitUrl = application.data.portraitUrl || null;
    let shopImageUrl = application.data.shopImageUrl || null;

    const portraitFile = formData.get("portrait");
    if (portraitFile instanceof File && portraitFile.size > 0 && portraitFile.size <= 3 * 1024 * 1024) {
      const buffer = Buffer.from(await portraitFile.arrayBuffer());
      portraitUrl = `data:${portraitFile.type || "image/jpeg"};base64,${buffer.toString("base64")}`;
    }

    const shopImageFile = formData.get("shopImage");
    if (shopImageFile instanceof File && shopImageFile.size > 0 && shopImageFile.size <= 3 * 1024 * 1024) {
      const buffer = Buffer.from(await shopImageFile.arrayBuffer());
      shopImageUrl = `data:${shopImageFile.type || "image/jpeg"};base64,${buffer.toString("base64")}`;
    }

    // Fall back to test assets in development if no image files were selected
    if (!portraitUrl && process.env.NODE_ENV === "development") {
      portraitUrl = "/test-assets/adaeze-vendor-portrait.webp";
    }
    if (!shopImageUrl && process.env.NODE_ENV === "development") {
      shopImageUrl = "/test-assets/adaeze-fabric-stall.webp";
    }

    // Update user portrait and phone if provided
    const userUpdate: { image?: string; phone?: string } = {};
    if (portraitUrl) userUpdate.image = portraitUrl;
    if (application.data.phone) userUpdate.phone = application.data.phone;
    if (Object.keys(userUpdate).length > 0) {
      await db.update(users).set(userUpdate).where(eq(users.id, auth.id));
    }

    // Append verification metadata to description if provided
    let combinedDescription = application.data.description || "";
    const metaParts: string[] = [];
    if (application.data.bankName && application.data.accountNumber) {
      metaParts.push(`Bank: ${application.data.bankName} - ${application.data.accountNumber} (${application.data.accountName || ""})`);
    }
    if (application.data.guarantorName && application.data.guarantorPhone) {
      metaParts.push(`Guarantor: ${application.data.guarantorName} - ${application.data.guarantorPhone}`);
    }
    if (metaParts.length > 0) {
      combinedDescription = combinedDescription
        ? `${combinedDescription}\n\n[Verification Info]\n${metaParts.join("\n")}`
        : `[Verification Info]\n${metaParts.join("\n")}`;
    }

    await db.insert(vendors).values({
      userId: auth.id,
      marketId: market.id,
      shopName: application.data.shopName,
      slug: chosenSlug,
      description: combinedDescription || null,
      shopImageUrl: shopImageUrl || null,
      approvalStatus: "pending",
    });

    revalidatePath("/admin/vendors");
    revalidatePath("/vendor/apply");

    return {
      ok: true,
      message:
        "Application received. Your verification documents have been submitted and an admin will review your shop.",
    };
  } catch {
    return {
      ok: false,
      message: "Could not submit this application. Please try again.",
    };
  }
}
