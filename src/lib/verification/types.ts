/**
 * Nigeria Verification Checklist types and NDPA 2023 compliance constants.
 */

export type UserVerificationTier =
  | "tier_0_browse"
  | "buyer_tier_1"
  | "buyer_tier_2"
  | "vendor_pending"
  | "vendor_verified"
  | "rider_pending"
  | "rider_verified";

export const TIER_LABELS: Record<UserVerificationTier, string> = {
  tier_0_browse: "Tier 0 (Browse only)",
  buyer_tier_1: "Buyer Tier 1 (Phone & Email Verified)",
  buyer_tier_2: "Buyer Tier 2 (ID Verified / Trusted History)",
  vendor_pending: "Vendor (Pending Verification)",
  vendor_verified: "Vendor (Verified & Approved)",
  rider_pending: "Rider (Pending Verification)",
  rider_verified: "Rider (Guarantor & ID Verified)",
};

export type CheckStatus = "verified" | "pending" | "failed" | "not_provided";

export type VendorVerificationChecklist = {
  // Person
  ninStatus: CheckStatus;
  selfieMatchStatus: CheckStatus;
  phoneOtpVerified: boolean;
  emailVerified: boolean;

  // Business
  businessType: "informal_trader" | "registered_business" | "limited_company";
  cacNumber?: string | null;
  cacVerified: boolean;
  tinNumber?: string | null;
  shopPhotoUrl?: string | null;
  portraitPhotoUrl?: string | null;

  // Location & Trust
  stallNumber?: string | null;
  marketLeaderReference?: string | null;
  guarantorName?: string | null;
  guarantorPhone?: string | null;
  guarantorCalledAndVerified: boolean;
  adminVisitOrVideoCallDone: boolean;

  // Payouts
  bankAccountResolved: boolean;
  bankAccountName?: string | null;
  bankAccountMatchVerified: boolean;
};

export type RiderVerificationChecklist = {
  ninStatus: CheckStatus;
  driverLicenceStatus: CheckStatus;
  vehicleType?: string | null;
  plateNumber?: string | null;
  vehiclePhotoUrl?: string | null;
  vehiclePapersVerified: boolean;

  // Guarantor letter and signature requirement
  guarantorName?: string | null;
  guarantorPhone?: string | null;
  guarantorLetterUrl?: string | null;
  guarantorLetterStatus: "verified" | "pending" | "missing";
  guarantorSignatureVerified: boolean;

  emergencyContact?: string | null;
  basicTrainingCompleted: boolean;
};

export type DisputeRiskSignals = {
  disputeCount: number;
  failedPaymentCount: number;
  isHighRisk: boolean;
  isSuspended: boolean;
  suspensionReason?: string | null;
  flags: string[];
};

/**
 * NDPA 2023 Masking Helpers
 * Prevents raw NIN, BVN, or account credentials from leaking into client bundles or logs.
 */
export function maskIdNumber(idNumber: string | null | undefined): string {
  if (!idNumber) return "Not provided";
  const trimmed = idNumber.trim();
  if (trimmed.length <= 4) return "****";
  const visible = trimmed.slice(-4);
  return `${"*".repeat(Math.max(trimmed.length - 4, 4))}${visible}`;
}

export function maskBankAccount(account: string | null | undefined): string {
  if (!account) return "Not provided";
  const trimmed = account.trim();
  if (trimmed.length <= 3) return "***";
  return `***${trimmed.slice(-3)}`;
}
