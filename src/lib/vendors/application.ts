const SHOP_NAME_MAX = 80;
const SHOP_DESCRIPTION_MAX = 300;
const SLUG_MAX = 60;
const SLUG_CANDIDATES = 50;

const STALL_NUMBER_MAX = 40;
const MAP_PIN_MIN = 5;
const MAP_PIN_MAX = 200;
const CAC_NUMBER_MAX = 20;
const TIN_NUMBER_MAX = 20;

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const slugSafePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const vendorBusinessTypes = ["informal", "business_name", "limited"] as const;
export type VendorBusinessType = (typeof vendorBusinessTypes)[number];

export type VendorApplicationInput = {
  shopName: string;
  description: string;
  marketSlug: string;
  stallNumber: string;
  businessType: VendorBusinessType;
  cacNumber: string;
  tinNumber: string;
  mapPin: string;
};

export type VendorApplicationResult =
  | { success: true; data: VendorApplicationInput }
  | { success: false };

/** Turn a shop name into its first-choice URL slug, or null when nothing usable remains. */
export function slugifyShopName(shopName: string): string | null {
  const base = shopName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX)
    .replace(/-+$/g, "");

  return slugSafePattern.test(base) ? base : null;
}

/**
 * Candidate slugs for an application: the plain shop-name slug first, then
 * numbered fallbacks so two shops with the same name can both exist.
 */
export function vendorSlugCandidates(shopName: string): string[] {
  const base = slugifyShopName(shopName);
  if (!base) return [];

  const candidates = [base];
  for (let n = 2; candidates.length < SLUG_CANDIDATES; n += 1) {
    candidates.push(`${base}-${n}`);
  }
  return candidates;
}

/** Validate the vendor application form. Market existence is checked by the action. */
export function validateVendorApplication(formData: FormData): VendorApplicationResult {
  const rawShopName = formData.get("shopName");
  const rawDescription = formData.get("description");
  const rawMarketSlug = formData.get("marketSlug");
  const rawStallNumber = formData.get("stallNumber");
  const rawBusinessType = formData.get("businessType");
  const rawCacNumber = formData.get("cacNumber");
  const rawTinNumber = formData.get("tinNumber");
  const rawMapPin = formData.get("mapPin");

  if (typeof rawShopName !== "string" || typeof rawMarketSlug !== "string") {
    return { success: false };
  }

  const shopName = rawShopName.trim();
  if (shopName.length === 0 || shopName.length > SHOP_NAME_MAX) {
    return { success: false };
  }
  if (!slugifyShopName(shopName)) {
    return { success: false };
  }

  let description = "";
  if (typeof rawDescription === "string" && rawDescription.length > 0) {
    description = rawDescription.trim();
    if (description.length > SHOP_DESCRIPTION_MAX) {
      return { success: false };
    }
  }

  const marketSlug = rawMarketSlug.trim();
  if (!slugSafePattern.test(marketSlug)) {
    return { success: false };
  }

  // Verification fields (Nigeria): stall and location are always required;
  // a CAC number is required for any registered business type.
  if (typeof rawStallNumber !== "string" || typeof rawBusinessType !== "string" || typeof rawMapPin !== "string") {
    return { success: false };
  }

  const stallNumber = rawStallNumber.trim();
  if (stallNumber.length === 0 || stallNumber.length > STALL_NUMBER_MAX) {
    return { success: false };
  }

  if (!(vendorBusinessTypes as readonly string[]).includes(rawBusinessType)) {
    return { success: false };
  }
  const businessType = rawBusinessType as VendorBusinessType;

  let cacNumber = "";
  if (typeof rawCacNumber === "string" && rawCacNumber.trim().length > 0) {
    cacNumber = rawCacNumber.trim();
  }
  if (businessType !== "informal" && cacNumber.length === 0) {
    // Registered businesses must bring their CAC number.
    return { success: false };
  }
  if (cacNumber.length > CAC_NUMBER_MAX) {
    return { success: false };
  }

  let tinNumber = "";
  if (typeof rawTinNumber === "string" && rawTinNumber.trim().length > 0) {
    tinNumber = rawTinNumber.trim();
  }
  if (tinNumber.length > TIN_NUMBER_MAX) {
    return { success: false };
  }

  const mapPin = rawMapPin.trim();
  if (mapPin.length < MAP_PIN_MIN || mapPin.length > MAP_PIN_MAX) {
    return { success: false };
  }

  return {
    success: true,
    data: {
      shopName,
      description,
      marketSlug,
      stallNumber,
      businessType,
      cacNumber,
      tinNumber,
      mapPin,
    },
  };
}

export function isVendorApplicationUuid(value: unknown): value is string {
  return typeof value === "string" && uuidPattern.test(value);
}
