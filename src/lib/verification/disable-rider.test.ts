import { describe, expect, it } from "vitest";

import { canApproveRiderWithGuarantor, recordVerificationAuditLog } from "./security-guard";
import { maskBankAccount, maskIdNumber } from "./types";
import { validateRiderApplication } from "@/lib/riders/application";

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

describe("Rider Verification & Disabling Rules", () => {
  it("blocks rider approval when guarantor letter is missing or unverified", () => {
    const result = canApproveRiderWithGuarantor({
      guarantorLetterStatus: "missing",
      guarantorSignatureVerified: false,
    });
    expect(result.canApprove).toBe(false);
    expect(result.missingRequirements).toContain("Guarantor letter or signature verification");
  });

  it("permits rider approval when guarantor signature is verified", () => {
    const result = canApproveRiderWithGuarantor({
      guarantorLetterStatus: "verified",
      guarantorSignatureVerified: true,
    });
    expect(result.canApprove).toBe(true);
    expect(result.missingRequirements.length).toBe(0);
  });

  it("validates full Nigerian rider application credentials", () => {
    const validForm = form({
      vehicleType: "Motorcycle (Okada)",
      plateNumber: "EDO-452-BEN",
      deliveryZone: "Ugbowo / UNIBEN Campus / Oluku",
      nin: "12345678901",
      phone: "08012345678",
      emergencyName: "Osasere Agbonlahor",
      emergencyPhone: "08098765432",
      bankName: "Access Bank",
      bankAccountNumber: "0123456789",
      bankAccountName: "John Doe",
      guarantorName: "Chief Osaro Igbinedion",
      guarantorPhone: "08023456789",
      guarantorRelationship: "Landlord / Property Owner",
      guarantorAddress: "14 Akpakpava Street, Benin City",
    });

    const result = validateRiderApplication(validForm);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.vehicleType).toBe("Motorcycle (Okada)");
      expect(result.data.plateNumber).toBe("EDO-452-BEN");
      expect(result.data.nin).toBe("12345678901");
      expect(result.data.bankAccountNumber).toBe("0123456789");
    }
  });

  it("rejects an invalid NIN length", () => {
    const invalidForm = form({
      nin: "12345", // must be 11 digits
    });
    const result = validateRiderApplication(invalidForm);
    expect(result.success).toBe(false);
  });

  it("rejects an invalid NUBAN length", () => {
    const invalidForm = form({
      bankAccountNumber: "123", // must be 10 digits
    });
    const result = validateRiderApplication(invalidForm);
    expect(result.success).toBe(false);
  });

  it("masks sensitive rider credentials for NDPA 2023 compliance", () => {
    expect(maskIdNumber("12345678901")).toBe("*******8901");
    expect(maskBankAccount("0123456789")).toBe("***789");
  });

  it("logs an audit event when an admin disables a rider", () => {
    const adminId = "admin-123";
    const targetUserId = "rider-456";

    const log = recordVerificationAuditLog(
      adminId,
      targetUserId,
      "disable_rider",
      "Admin disabled rider request req-1 and revoked delivery privileges",
    );

    expect(log.action).toBe("disable_rider");
    expect(log.details).toContain("Admin disabled rider");
    expect(log.adminId).toBe(adminId);
    expect(log.targetUserId).toBe(targetUserId);
  });

  it("logs an audit event when an admin re-activates a rider", () => {
    const adminId = "admin-123";
    const targetUserId = "rider-456";

    const log = recordVerificationAuditLog(
      adminId,
      targetUserId,
      "reactivate_rider",
      "Admin re-activated rider request req-1 and restored delivery access",
    );

    expect(log.action).toBe("reactivate_rider");
    expect(log.details).toContain("Admin re-activated rider");
  });
});
