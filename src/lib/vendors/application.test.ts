import { describe, expect, it } from "vitest";

import { slugifyShopName, validateVendorApplication, vendorSlugCandidates } from "./application";

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

/** A valid application; tests override single fields to force failures. */
function validForm(overrides: Record<string, string> = {}) {
  return form({
    shopName: "Adaeze Fabrics",
    description: "Ankara and lace.",
    marketSlug: "oba-market",
    stallNumber: "B12",
    businessType: "informal",
    cacNumber: "",
    tinNumber: "",
    mapPin: "6.4654,3.4062",
    ...overrides,
  });
}

describe("vendor application rules", () => {
  it("slugifies shop names into URL-safe slugs", () => {
    expect(slugifyShopName("Adaeze Fabrics")).toBe("adaeze-fabrics");
    expect(slugifyShopName("Kingsway Mobile & Accessories!")).toBe("kingsway-mobile-accessories");
    expect(slugifyShopName("  Edo  Provisions  Mart ")).toBe("edo-provisions-mart");
  });

  it("returns null when a shop name leaves no usable slug", () => {
    expect(slugifyShopName("???")).toBeNull();
    expect(slugifyShopName("---")).toBeNull();
  });

  it("offers numbered fallback slugs for name collisions", () => {
    const candidates = vendorSlugCandidates("Adaeze Fabrics");
    expect(candidates[0]).toBe("adaeze-fabrics");
    expect(candidates[1]).toBe("adaeze-fabrics-2");
    expect(new Set(candidates).size).toBe(candidates.length);
  });

  it("accepts a complete application and trims the fields", () => {
    const valid = validateVendorApplication(validForm({
      shopName: "  Adaeze Fabrics  ",
      description: " Ankara and lace. ",
      marketSlug: " oba-market ",
      stallNumber: " B12 ",
      mapPin: " 6.4654,3.4062 ",
    }));
    expect(valid).toMatchObject({
      success: true,
      data: {
        shopName: "Adaeze Fabrics",
        description: "Ankara and lace.",
        marketSlug: "oba-market",
        stallNumber: "B12",
        businessType: "informal",
        cacNumber: "",
        tinNumber: "",
        mapPin: "6.4654,3.4062",
      },
    });
  });

  it("allows an empty description", () => {
    const valid = validateVendorApplication(validForm({ description: "" }));
    expect(valid).toMatchObject({ success: true, data: { description: "" } });
  });

  it("rejects a missing or oversized shop name", () => {
    expect(validateVendorApplication(validForm({ shopName: "" })).success).toBe(false);
    expect(validateVendorApplication(validForm({ shopName: "x".repeat(81) })).success).toBe(false);
  });

  it("rejects an oversized description", () => {
    const longDescription = "y".repeat(301);
    expect(validateVendorApplication(validForm({ description: longDescription })).success).toBe(false);
  });

  it("rejects a missing or malformed market slug", () => {
    expect(validateVendorApplication(validForm({ marketSlug: "" })).success).toBe(false);
    expect(validateVendorApplication(validForm({ marketSlug: "not a slug!" })).success).toBe(false);
  });

  it("rejects a form with no market field at all", () => {
    const data = form({ shopName: "Adaeze Fabrics" });
    expect(validateVendorApplication(data).success).toBe(false);
  });

  it("rejects a missing or oversized stall number", () => {
    expect(validateVendorApplication(validForm({ stallNumber: "" })).success).toBe(false);
    expect(validateVendorApplication(validForm({ stallNumber: "x".repeat(41) })).success).toBe(false);
  });

  it("rejects a form with no stall number field at all", () => {
    const data = form({ shopName: "Adaeze Fabrics", marketSlug: "oba-market", mapPin: "6.4654,3.4062" });
    expect(validateVendorApplication(data).success).toBe(false);
  });

  it("requires a known business type", () => {
    expect(validateVendorApplication(validForm({ businessType: "informal" })).success).toBe(true);
    expect(validateVendorApplication(validForm({ businessType: "business_name", cacNumber: "1902837" })).success).toBe(true);
    expect(validateVendorApplication(validForm({ businessType: "limited", cacNumber: "7110092" })).success).toBe(true);
    expect(validateVendorApplication(validForm({ businessType: "public_limited" })).success).toBe(false);
  });

  it("requires a CAC number for registered businesses but not informal traders", () => {
    expect(validateVendorApplication(validForm({ businessType: "informal", cacNumber: "" })).success).toBe(true);
    expect(validateVendorApplication(validForm({ businessType: "business_name", cacNumber: "" })).success).toBe(false);
    expect(validateVendorApplication(validForm({ businessType: "limited", cacNumber: "" })).success).toBe(false);
    expect(validateVendorApplication(validForm({ businessType: "limited", cacNumber: " RC 1902837 " })).success).toBe(true);
    expect(validateVendorApplication(validForm({ businessType: "informal", cacNumber: "x".repeat(21) })).success).toBe(false);
  });

  it("allows an optional TIN but caps its length", () => {
    expect(validateVendorApplication(validForm({ tinNumber: "12345678-0001" })).success).toBe(true);
    expect(validateVendorApplication(validForm({ tinNumber: "x".repeat(21) })).success).toBe(false);
  });

  it("requires a map pin with a usable length", () => {
    expect(validateVendorApplication(validForm({ mapPin: "" })).success).toBe(false);
    expect(validateVendorApplication(validForm({ mapPin: "  12 " })).success).toBe(false);
    expect(validateVendorApplication(validForm({ mapPin: "x".repeat(201) })).success).toBe(false);
    expect(validateVendorApplication(validForm({ mapPin: "6.4654,3.4062" })).success).toBe(true);
  });
});
