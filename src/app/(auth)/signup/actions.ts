"use server";

import { submitRiderApplication } from "@/app/rider/apply/actions";
import { submitVendorApplication } from "@/app/vendor/apply/actions";
import { requireRole } from "@/lib/auth/guard";
import { parseSignupRole } from "@/lib/auth/signup-role";

type SubmitSignupApplicationResult =
  | { ok: true; submitted: boolean; message: string }
  | { ok: false; message: string };

/**
 * File the vendor or rider application chosen at signup. The account was
 * just created as a buyer, so the existing apply actions (with their
 * duplicate checks, validation and revalidation) can be reused as-is.
 * A buyer needs no application.
 */
export async function submitSignupApplication(
  formData: FormData,
): Promise<SubmitSignupApplicationResult> {
  const auth = await requireRole({ api: true }, "buyer");
  if (auth instanceof Response) {
    const body = (await auth.json()) as { error?: string };
    return {
      ok: false,
      message: body.error ?? "You do not have access.",
    };
  }

  const role = parseSignupRole(formData.get("signupRole"));
  if (!role) {
    return { ok: false, message: "Choose how you want to use OjaLink." };
  }

  if (role === "buyer") {
    return { ok: true, submitted: false, message: "" };
  }

  const result =
    role === "vendor"
      ? await submitVendorApplication(formData)
      : await submitRiderApplication(formData);

  if (!result.ok) {
    // The account exists either way; the application can be filed again
    // from the buyer area, so this is not fatal.
    return { ok: false, message: result.message };
  }

  return { ok: true, submitted: true, message: result.message };
}
