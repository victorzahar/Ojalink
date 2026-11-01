export const orderStatusEmailCopy = {
  pending: {
    subject: "Payment needed for your OjaLink order",
    body: "Your order from {shopName} is waiting for payment.",
  },
  paid: {
    subject: "Payment received for your OjaLink order",
    body: "Your payment for the order from {shopName} has been received.",
  },
  accepted: {
    subject: "Your OjaLink order is confirmed",
    body: "Good news! {shopName} has confirmed your order.",
  },
  rejected: {
    subject: "An update about your OjaLink order",
    body: "Sorry, {shopName} couldn't accept your order. Please contact OjaLink support.",
  },
  picked_up: {
    subject: "Your order is on the way",
    body: "Good news! Your order from {shopName} has been picked up.",
  },
  delivered: {
    subject: "Your OjaLink order has arrived",
    body: "Your order from {shopName} has arrived. Enjoy!",
  },
  cancelled: {
    subject: "Your OjaLink order was cancelled",
    body: "Your order from {shopName} was cancelled.",
  },
  trackOrderLink: "Track your order",
} as const;
