const SHOP_NAME_MAX = 80;
const SHOP_DESCRIPTION_MAX = 300;
const SLUG_MAX = 60;
const SLUG_CANDIDATES = 50;

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const slugSafePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type VendorApplicationInput = {
  shopName: string;
  description: string;
  marketSlug: string;
  phone?: string;
  nin?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  guarantorName?: string;
  guarantorPhone?: string;
  portraitUrl?: string;
  shopImageUrl?: string;
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

  const rawPhone = formData.get("phone");
  const rawNin = formData.get("nin");
  const rawBankName = formData.get("bankName");
  const rawAccountNumber = formData.get("accountNumber");
  const rawAccountName = formData.get("accountName");
  const rawGuarantorName = formData.get("guarantorName");
  const rawGuarantorPhone = formData.get("guarantorPhone");
  const rawPortraitUrl = formData.get("portraitUrl");
  const rawShopImageUrl = formData.get("shopImageUrl");

  return {
    success: true,
    data: {
      shopName,
      description,
      marketSlug,
      phone: typeof rawPhone === "string" ? rawPhone.trim() : undefined,
      nin: typeof rawNin === "string" ? rawNin.trim() : undefined,
      bankName: typeof rawBankName === "string" ? rawBankName.trim() : undefined,
      accountNumber: typeof rawAccountNumber === "string" ? rawAccountNumber.trim() : undefined,
      accountName: typeof rawAccountName === "string" ? rawAccountName.trim() : undefined,
      guarantorName: typeof rawGuarantorName === "string" ? rawGuarantorName.trim() : undefined,
      guarantorPhone: typeof rawGuarantorPhone === "string" ? rawGuarantorPhone.trim() : undefined,
      portraitUrl: typeof rawPortraitUrl === "string" ? rawPortraitUrl.trim() : undefined,
      shopImageUrl: typeof rawShopImageUrl === "string" ? rawShopImageUrl.trim() : undefined,
    },
  };
}

export function isVendorApplicationUuid(value: unknown): value is string {
  return typeof value === "string" && uuidPattern.test(value);
}
