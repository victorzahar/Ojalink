// The one legal order of a delivery's status: no skipping, no going back.
// The rider actions in actions.ts read their "must be in this status first"
// rule from here, so this list and the database stay in step.
export const deliveryStatusFlow = ["available", "accepted", "picked_up", "delivered"] as const;

export type DeliveryFlowStatus = (typeof deliveryStatusFlow)[number];

/** For each step a rider can take: the only status the delivery may be in before it. */
export const requiredStatusBefore = {
  accepted: "available",
  picked_up: "accepted",
  delivered: "picked_up",
} as const;

/** True only for the very next step in the flow. Skips, repeats and going back are false. */
export function canMoveDelivery(from: DeliveryFlowStatus, to: DeliveryFlowStatus): boolean {
  return deliveryStatusFlow.indexOf(to) === deliveryStatusFlow.indexOf(from) + 1;
}
