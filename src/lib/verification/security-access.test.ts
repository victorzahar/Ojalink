import { describe, expect, it } from "vitest";

import {
  maskBankAccount,
  maskIdNumber,
  TIER_LABELS,
} from "./types";
import {
  canApproveRiderWithGuarantor,
  canApproveVendorWithChecklist,
  evaluateDisputeRisk,
  recordVerificationAuditLog,
} from "./security-guard";

describe("NDPA 2023 Data Masking & Redaction", () => {
  it("masks 11-digit NIN and BVN numbers leaving only last 4 digits visible", () => {
    const nin = "12345678901";
    const masked = maskIdNumber(nin);
    expect(masked).toBe("*******8901");
    expect(masked).not.toContain("1234567");
  });

  it("handles short or empty identity inputs safely without throwing", () => {
    expect(maskIdNumber(null)).toBe("Not provided");
    expect(maskIdNumber("")).toBe("Not provided");
    expect(maskIdNumber("123")).toBe("****");
  });

  it("masks bank account numbers leaving only last 3 digits visible", () => {
    const account = "0123456789";
    const masked = maskBankAccount(account);
    expect(masked).toBe("***789");
    expect(masked).not.toContain("012345");
  });

  it("defines standard Nigeria verification tiers", () => {
    expect(TIER_LABELS.tier_0_browse).toContain("Tier 0");
    expect(TIER_LABELS.buyer_tier_1).toContain("Buyer Tier 1");
    expect(TIER_LABELS.rider_verified).toContain("Guarantor & ID Verified");
  });
});

describe("Rider Guarantor Letter and Signature Verification", () => {
  it("prevents approving a rider if guarantor letter / signature is missing or unverified", () => {
    const result = canApproveRiderWithGuarantor({
      guarantorLetterStatus: "missing",
      guarantorSignatureVerified: false,
    });
    expect(result.canApprove).toBe(false);
    expect(result.missingRequirements).toContain("Guarantor letter or signature verification");
  });

  it("allows approving a rider when guarantor letter status is verified", () => {
    const result = canApproveRiderWithGuarantor({
      guarantorLetterStatus: "verified",
      guarantorSignatureVerified: false,
    });
    expect(result.canApprove).toBe(true);
    expect(result.missingRequirements).toHaveLength(0);
  });

  it("allows approving a rider when guarantor signature is verified", () => {
    const result = canApproveRiderWithGuarantor({
      guarantorLetterStatus: "pending",
      guarantorSignatureVerified: true,
    });
    expect(result.canApprove).toBe(true);
    expect(result.missingRequirements).toHaveLength(0);
  });
});

describe("Vendor Photo Verification Rules", () => {
  it("blocks vendor approval when portrait or stall photo is missing", () => {
    const resultMissingStall = canApproveVendorWithChecklist({}, true, false);
    expect(resultMissingStall.canApprove).toBe(false);
    expect(resultMissingStall.missingRequirements).toContain("Shop or stall photo");

    const resultMissingPortrait = canApproveVendorWithChecklist({}, false, true);
    expect(resultMissingPortrait.canApprove).toBe(false);
    expect(resultMissingPortrait.missingRequirements).toContain("Vendor portrait photo");
  });

  it("permits vendor approval when both required verification photos are present", () => {
    const result = canApproveVendorWithChecklist({}, true, true);
    expect(result.canApprove).toBe(true);
    expect(result.missingRequirements).toHaveLength(0);
  });
});

describe("Dispute Risk Signals & Monitoring", () => {
  it("flags accounts with repeated disputes as high risk", () => {
    const risk = evaluateDisputeRisk(3, 0);
    expect(risk.isHighRisk).toBe(true);
    expect(risk.flags).toContain("High dispute frequency (3+ open or resolved disputes)");
  });

  it("flags accounts with repeated failed payments", () => {
    const risk = evaluateDisputeRisk(0, 4);
    expect(risk.isHighRisk).toBe(true);
    expect(risk.flags).toContain("Elevated failed payment attempts");
  });

  it("identifies low risk accounts with clean history", () => {
    const risk = evaluateDisputeRisk(0, 1);
    expect(risk.isHighRisk).toBe(false);
    expect(risk.flags).toHaveLength(0);
  });
});

describe("Admin Access Audit Logging (NDPA 2023 Compliance)", () => {
  it("records audit logs when admins inspect sensitive verification documents", () => {
    const adminId = "a0000000-0000-0000-0000-000000000001";
    const targetUserId = "b0000000-0000-0000-0000-000000000002";

    const entry = recordVerificationAuditLog(
      adminId,
      targetUserId,
      "view_guarantor_letter",
      "Inspected guarantor letter and signatory confirmation",
    );

    expect(entry.adminId).toBe(adminId);
    expect(entry.targetUserId).toBe(targetUserId);
    expect(entry.action).toBe("view_guarantor_letter");
    expect(entry.timestamp).toBeInstanceOf(Date);
  });
});
