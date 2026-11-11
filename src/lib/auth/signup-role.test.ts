import { describe, expect, it } from "vitest";

import { parseSignupRole, signupLandingPath } from "./signup-role";

describe("signup role", () => {
  it("accepts the three signup roles", () => {
    expect(parseSignupRole("buyer")).toBe("buyer");
    expect(parseSignupRole("vendor")).toBe("vendor");
    expect(parseSignupRole("rider")).toBe("rider");
  });

  it("rejects anything else, including a smuggled admin role", () => {
    expect(parseSignupRole("admin")).toBeNull();
    expect(parseSignupRole("")).toBeNull();
    expect(parseSignupRole(42)).toBeNull();
    expect(parseSignupRole(["rider"])).toBeNull();
  });

  it("lands a buyer in the buyer area", () => {
    expect(signupLandingPath("buyer", false)).toBe("/buyer");
    expect(signupLandingPath("buyer", true)).toBe("/buyer");
  });

  it("lands an approved-path applicant on their application status page", () => {
    expect(signupLandingPath("vendor", true)).toBe("/vendor/apply");
    expect(signupLandingPath("rider", true)).toBe("/rider/apply");
  });

  it("falls back to the buyer area when the application could not be filed", () => {
    expect(signupLandingPath("vendor", false)).toBe("/buyer");
    expect(signupLandingPath("rider", false)).toBe("/buyer");
  });
});
