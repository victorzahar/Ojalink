import { describe, expect, it } from "vitest";

import { deliveryStatusEnum } from "@/lib/db/schema";
import {
  canMoveDelivery,
  deliveryStatusFlow,
  requiredStatusBefore,
  type DeliveryFlowStatus,
} from "@/lib/rider/status-flow";

describe("delivery status order", () => {
  it("runs available, accepted, picked_up, delivered", () => {
    expect([...deliveryStatusFlow]).toEqual(["available", "accepted", "picked_up", "delivered"]);
  });

  it("matches the database enum, in the same order", () => {
    expect([...deliveryStatusFlow]).toEqual([...deliveryStatusEnum.enumValues]);
  });

  it("allows each status to move to the very next one", () => {
    for (let index = 0; index < deliveryStatusFlow.length - 1; index += 1) {
      expect(canMoveDelivery(deliveryStatusFlow[index], deliveryStatusFlow[index + 1])).toBe(true);
    }
  });

  it("refuses to skip a step", () => {
    expect(canMoveDelivery("available", "picked_up")).toBe(false);
    expect(canMoveDelivery("available", "delivered")).toBe(false);
    expect(canMoveDelivery("accepted", "delivered")).toBe(false);
  });

  it("refuses to go backwards", () => {
    expect(canMoveDelivery("accepted", "available")).toBe(false);
    expect(canMoveDelivery("picked_up", "accepted")).toBe(false);
    expect(canMoveDelivery("delivered", "picked_up")).toBe(false);
  });

  it("refuses to repeat the same status", () => {
    for (const status of deliveryStatusFlow) {
      expect(canMoveDelivery(status, status)).toBe(false);
    }
  });

  it("allows nothing after delivered", () => {
    for (const status of deliveryStatusFlow) {
      expect(canMoveDelivery("delivered", status as DeliveryFlowStatus)).toBe(false);
    }
  });

  it("names the status directly before each step a rider can take", () => {
    expect(requiredStatusBefore).toEqual({
      accepted: "available",
      picked_up: "accepted",
      delivered: "picked_up",
    });

    for (const [target, required] of Object.entries(requiredStatusBefore)) {
      const targetIndex = deliveryStatusFlow.indexOf(target as DeliveryFlowStatus);
      expect(deliveryStatusFlow[targetIndex - 1]).toBe(required);
    }
  });
});
