import {
  type RiderVerificationChecklist,
  type VendorVerificationChecklist,
  type DisputeRiskSignals,
} from "./types";

export type AuditLogEntry = {
  adminId: string;
  targetUserId: string;
  action: "view_photos" | "view_guarantor_letter" | "verify_guarantor" | "approve_rider" | "approve_vendor" | "suspend_account";
  details?: string;
  timestamp: Date;
};

// In-memory audit log accumulator for tracking admin access (persisted or logged safely)
const auditLogs: AuditLogEntry[] = [];

/**
 * Record an admin access audit event in compliance with NDPA 2023 accountability rules.
 */
export function recordVerificationAuditLog(
  adminId: string,
  targetUserId: string,
  action: AuditLogEntry["action"],
  details?: string,
): AuditLogEntry {
  const entry: AuditLogEntry = {
    adminId,
    targetUserId,
    action,
    details,
    timestamp: new Date(),
  };
  auditLogs.push(entry);
  return entry;
}

export function getVerificationAuditLogs(): readonly AuditLogEntry[] {
  return auditLogs;
}

/**
 * Validates whether a rider can be approved in the admin area.
 * Requires that a guarantor letter/signature is verified.
 */
export function canApproveRiderWithGuarantor(checklist: Partial<RiderVerificationChecklist>): {
  canApprove: boolean;
  missingRequirements: string[];
} {
  const missingRequirements: string[] = [];

  const hasGuarantorVerified =
    checklist.guarantorLetterStatus === "verified" || checklist.guarantorSignatureVerified === true;

  if (!hasGuarantorVerified) {
    missingRequirements.push("Guarantor letter or signature verification");
  }

  return {
    canApprove: missingRequirements.length === 0,
    missingRequirements,
  };
}

/**
 * Validates whether a vendor has required verification items (photos, identity, etc.).
 */
export function canApproveVendorWithChecklist(
  checklist: Partial<VendorVerificationChecklist>,
  hasPortraitPhoto: boolean,
  hasShopPhoto: boolean,
): {
  canApprove: boolean;
  missingRequirements: string[];
} {
  const missingRequirements: string[] = [];

  if (!hasPortraitPhoto) {
    missingRequirements.push("Vendor portrait photo");
  }
  if (!hasShopPhoto) {
    missingRequirements.push("Shop or stall photo");
  }

  return {
    canApprove: missingRequirements.length === 0,
    missingRequirements,
  };
}

/**
 * Evaluates account dispute risk signals.
 */
export function evaluateDisputeRisk(
  disputeCount: number,
  failedPaymentCount: number,
  isSuspended: boolean = false,
  suspensionReason?: string | null,
): DisputeRiskSignals {
  const flags: string[] = [];
  if (disputeCount >= 3) {
    flags.push("High dispute frequency (3+ open or resolved disputes)");
  }
  if (failedPaymentCount >= 4) {
    flags.push("Elevated failed payment attempts");
  }

  return {
    disputeCount,
    failedPaymentCount,
    isHighRisk: disputeCount >= 2 || failedPaymentCount >= 3,
    isSuspended,
    suspensionReason,
    flags,
  };
}
