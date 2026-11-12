import { describe, expect, it } from "vitest";

import { canCreateVendorProducts } from "@/lib/vendor-products/validation";
import { recordVerificationAuditLog } from "./security-guard";

describe("Vendor Disabling and Offboarding Rules", () => {
  it("prevents disabled or rejected vendors from managing or creating products", () => {
    expect(canCreateVendorProducts("rejected")).toBe(false);
    expect(canCreateVendorProducts("pending")).toBe(false);
    expect(canCreateVendorProducts(null)).toBe(false);
  });

  it("permits approved active vendors to manage products", () => {
    expect(canCreateVendorProducts("approved")).toBe(true);
  });

  it("logs an audit event when an admin disables a vendor", () => {
    const adminId = "admin-123";
    const targetUserId = "vendor-456";

    const log = recordVerificationAuditLog(
      adminId,
      targetUserId,
      "suspend_account",
      "Vendor disabled / offboarded by admin: role reverted to buyer and products hidden",
    );

    expect(log.action).toBe("suspend_account");
    expect(log.details).toContain("Vendor disabled / offboarded");
    expect(log.adminId).toBe(adminId);
  });

  it("logs an audit event when an admin re-activates a vendor", () => {
    const adminId = "admin-123";
    const targetUserId = "vendor-456";

    const log = recordVerificationAuditLog(
      adminId,
      targetUserId,
      "approve_vendor",
      "Vendor approved and activated by admin",
    );

    expect(log.action).toBe("approve_vendor");
    expect(log.details).toContain("Vendor approved and activated");
  });
});
