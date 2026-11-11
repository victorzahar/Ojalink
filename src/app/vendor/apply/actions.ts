"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/guard";
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

    await db.insert(vendors).values({
      userId: auth.id,
      marketId: market.id,
      shopName: application.data.shopName,
      slug: chosenSlug,
      description: application.data.description || null,
      approvalStatus: "pending",
    });

    revalidatePath("/admin/vendors");
    revalidatePath("/vendor/apply");

    return {
      ok: true,
      message:
        "Application received. An admin will review your shop and you will get vendor access once approved.",
    };
  } catch {
    return {
      ok: false,
      message: "Could not submit this application. Please try again.",
    };
  }
}
