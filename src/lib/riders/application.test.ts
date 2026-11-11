import { describe, expect, it } from "vitest";

import { validateRiderApplication } from "./application";

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

describe("rider application rules", () => {
  it("accepts an application with no note", () => {
    expect(validateRiderApplication(form({}))).toMatchObject({ success: true, data: { note: "" } });
  });

  it("trims the note", () => {
    expect(validateRiderApplication(form({ note: "  I have a bike and free evenings.  " })))
      .toMatchObject({ success: true, data: { note: "I have a bike and free evenings." } });
  });

  it("rejects an oversized note", () => {
    expect(validateRiderApplication(form({ note: "x".repeat(201) })).success).toBe(false);
  });
});
