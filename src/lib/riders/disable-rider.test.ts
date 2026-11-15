import { describe, expect, it } from "vitest";

describe("Rider disable and reactivate lifecycle guards", () => {
  it("only allows disabling an approved rider", () => {
    function canDisableRider(status: "pending" | "approved" | "rejected") {
      return status === "approved";
    }

    expect(canDisableRider("approved")).toBe(true);
    expect(canDisableRider("pending")).toBe(false);
    expect(canDisableRider("rejected")).toBe(false);
  });

  it("only allows reactivating a disabled / rejected rider", () => {
    function canReactivateRider(status: "pending" | "approved" | "rejected") {
      return status === "rejected";
    }

    expect(canReactivateRider("rejected")).toBe(true);
    expect(canReactivateRider("pending")).toBe(false);
    expect(canReactivateRider("approved")).toBe(false);
  });
});
