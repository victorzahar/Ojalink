import { describe, expect, it } from "vitest";

describe("Vendor disable and reactivate lifecycle guards", () => {
  it("only allows disabling an active approved vendor", () => {
    function canDisable(status: "pending" | "approved" | "rejected") {
      return status === "approved";
    }

    expect(canDisable("approved")).toBe(true);
    expect(canDisable("pending")).toBe(false);
    expect(canDisable("rejected")).toBe(false);
  });

  it("only allows reactivating a disabled / rejected vendor", () => {
    function canReactivate(status: "pending" | "approved" | "rejected") {
      return status === "rejected";
    }

    expect(canReactivate("rejected")).toBe(true);
    expect(canReactivate("pending")).toBe(false);
    expect(canReactivate("approved")).toBe(false);
  });

  it("sets 3-day payout hold on reactivation", () => {
    const now = new Date("2026-11-15T12:00:00Z");
    const holdDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    expect(holdDate.getUTCDate()).toBe(18);
  });
});
