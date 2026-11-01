export const orderStatusCopy = {
  pending: {
    title: "Waiting for payment",
    message: "We haven't received your payment yet.",
  },
  paid: {
    title: "Payment received",
    message: "Your order has been sent to the vendor.",
  },
  accepted: {
    title: "Vendor confirmed",
    message: "The vendor is getting your order ready.",
  },
  rejected: {
    title: "Order not accepted",
    message: "Sorry, the vendor couldn't take this order. Please contact OjaLink support.",
  },
  picked_up: {
    title: "On the way",
    message: "A rider has picked up your order.",
  },
  delivered: {
    title: "Delivered",
    message: "Your order has arrived. Enjoy!",
  },
  cancelled: {
    title: "Order cancelled",
    message: "This order was cancelled.",
  },
  refunded: {
    title: "Order refunded",
    message: "This order was refunded.",
  },
} as const;
