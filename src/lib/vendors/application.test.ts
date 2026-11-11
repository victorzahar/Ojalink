import { describe, expect, it } from "vitest";

import { slugifyShopName, validateVendorApplication, vendorSlugCandidates } from "./application";

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
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
    const valid = validateVendorApplication(form({
      shopName: "  Adaeze Fabrics  ",
      description: " Ankara and lace. ",
      marketSlug: " oba-market ",
    }));
    expect(valid).toMatchObject({
      success: true,
      data: { shopName: "Adaeze Fabrics", description: "Ankara and lace.", marketSlug: "oba-market" },
    });
  });

  it("allows an empty description", () => {
    const valid = validateVendorApplication(form({ shopName: "Adaeze Fabrics", description: "", marketSlug: "oba-market" }));
    expect(valid).toMatchObject({ success: true, data: { description: "" } });
  });

  it("rejects a missing or oversized shop name", () => {
    expect(validateVendorApplication(form({ shopName: "", marketSlug: "oba-market" })).success).toBe(false);
    expect(validateVendorApplication(form({ shopName: "x".repeat(81), marketSlug: "oba-market" })).success).toBe(false);
  });

  it("rejects an oversized description", () => {
    const longDescription = "y".repeat(301);
    expect(validateVendorApplication(form({ shopName: "Adaeze Fabrics", description: longDescription, marketSlug: "oba-market" })).success).toBe(false);
  });

  it("rejects a missing or malformed market slug", () => {
    expect(validateVendorApplication(form({ shopName: "Adaeze Fabrics", marketSlug: "" })).success).toBe(false);
    expect(validateVendorApplication(form({ shopName: "Adaeze Fabrics", marketSlug: "not a slug!" })).success).toBe(false);
  });

  it("rejects a form with no market field at all", () => {
    expect(validateVendorApplication(form({ shopName: "Adaeze Fabrics" })).success).toBe(false);
  });
});
