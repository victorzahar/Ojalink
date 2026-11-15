import { describe, expect, it } from "vitest";

import { validateRiderApplication } from "./application";

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

/** A valid application; tests override single fields to force failures. */
function validForm(overrides: Record<string, string> = {}) {
  return form({
    vehicleType: "motorbike",
    plateNumber: "abc123xy",
    homeMapPin: "6.4654,3.4062",
    emergencyContactName: "Ngozi Okon",
    emergencyContactPhone: "0801 234 5678",
    guarantor1Name: "Pastor Emeka Nwosu",
    guarantor1Phone: "0802 345 6789",
    guarantor1Relation: "Family friend",
    guarantor2Name: "Bisi Alade",
    guarantor2Phone: "0803 456 7890",
    guarantor2Relation: "Landlord",
    trainingConfirmed: "on",
    note: "",
    ...overrides,
  });
}

describe("rider application rules", () => {
  it("accepts a complete application and normalises the plate", () => {
    const valid = validateRiderApplication(validForm({
      plateNumber: " abc123xy ",
      emergencyContactPhone: " 0801 234 5678 ",
    }));
    expect(valid.success).toBe(true);
    if (valid.success) {
      expect(valid.data.vehicleType).toBe("motorbike");
      expect(valid.data.plateNumber).toBe("ABC123XY");
      expect(valid.data.guarantors).toHaveLength(2);
      expect(valid.data.trainingConfirmed).toBe(true);
      expect(valid.data.note).toBe("");
    }
  });

  it("accepts every vehicle type and rejects unknown ones", () => {
    expect(validateRiderApplication(validForm({ vehicleType: "tricycle" })).success).toBe(true);
    expect(validateRiderApplication(validForm({ vehicleType: "car" })).success).toBe(true);
    expect(validateRiderApplication(validForm({ vehicleType: "helicopter" })).success).toBe(false);
    expect(validateRiderApplication(validForm({ vehicleType: "" })).success).toBe(false);
  });

  it("validates the plate number format", () => {
    expect(validateRiderApplication(validForm({ plateNumber: "AB12" })).success).toBe(false);
    expect(validateRiderApplication(validForm({ plateNumber: "x".repeat(13) })).success).toBe(false);
    expect(validateRiderApplication(validForm({ plateNumber: "LA 123 ABC" })).success).toBe(false);
    expect(validateRiderApplication(validForm({ plateNumber: "LA-123-AB" })).success).toBe(true);
  });

  it("requires a map pin with usable length", () => {
    expect(validateRiderApplication(validForm({ homeMapPin: "" })).success).toBe(false);
    expect(validateRiderApplication(validForm({ homeMapPin: "  12 " })).success).toBe(false);
    expect(validateRiderApplication(validForm({ homeMapPin: "x".repeat(201) })).success).toBe(false);
  });

  it("validates the emergency contact", () => {
    expect(validateRiderApplication(validForm({ emergencyContactName: "" })).success).toBe(false);
    expect(validateRiderApplication(validForm({ emergencyContactPhone: "123" })).success).toBe(false);
    expect(validateRiderApplication(validForm({ emergencyContactPhone: "+2348012345678" })).success).toBe(true);
    expect(validateRiderApplication(validForm({ emergencyContactPhone: "080x 234 5678" })).success).toBe(false);
  });

  it("requires both guarantors with name, phone and relation", () => {
    expect(validateRiderApplication(validForm({ guarantor1Name: "" })).success).toBe(false);
    expect(validateRiderApplication(validForm({ guarantor1Phone: "12" })).success).toBe(false);
    expect(validateRiderApplication(validForm({ guarantor1Relation: "" })).success).toBe(false);
    expect(validateRiderApplication(validForm({ guarantor2Name: "" })).success).toBe(false);
  });

  it("rejects duplicated phone numbers across contacts and guarantors", () => {
    expect(validateRiderApplication(validForm({
      guarantor1Phone: "0801 234 5678",
      emergencyContactPhone: "08012345678",
    })).success).toBe(false);
    expect(validateRiderApplication(validForm({
      guarantor2Phone: "08023456789",
      guarantor1Phone: "0802 345 6789",
    })).success).toBe(false);
  });

  it("requires the training acknowledgement", () => {
    expect(validateRiderApplication(validForm({ trainingConfirmed: "" })).success).toBe(false);
    expect(validateRiderApplication(validForm({ trainingConfirmed: "on" })).success).toBe(true);
  });

  it("allows an optional note but caps its length", () => {
    expect(validateRiderApplication(validForm({ note: "I deliver around Yaba." })).success).toBe(true);
    expect(validateRiderApplication(validForm({ note: "x".repeat(201) })).success).toBe(false);
  });
});
