import "server-only";

import { orderStatusEmailCopy } from "@/lib/orders/email-copy";

type OrderStatus = Exclude<keyof typeof orderStatusEmailCopy, "trackOrderLink">;

type SendOrderStatusEmailInput = {
  to: string;
  orderId: string;
  status: OrderStatus;
  shopName: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function sendOrderStatusEmail({
  to,
  orderId,
  status,
  shopName,
}: SendOrderStatusEmailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY is missing; the order status email was not sent.");
    return;
  }

  const from = process.env.EMAIL_FROM;
  if (!from) {
    throw new Error("EMAIL_FROM is required to send order status emails.");
  }

  const appUrl = process.env.BETTER_AUTH_URL;
  if (!appUrl) {
    throw new Error("BETTER_AUTH_URL is required to create the order tracking link.");
  }

  const copy = orderStatusEmailCopy[status];
  const body = copy.body.replace("{shopName}", shopName);
  const orderUrl = new URL(`/orders/${encodeURIComponent(orderId)}`, appUrl).toString();
  const safeBody = escapeHtml(body);
  const safeOrderUrl = escapeHtml(orderUrl);
  const safeLinkText = escapeHtml(orderStatusEmailCopy.trackOrderLink);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: copy.subject,
      text: `${body}\n\n${orderStatusEmailCopy.trackOrderLink}: ${orderUrl}`,
      html: `<p>${safeBody}</p><p><a href="${safeOrderUrl}">${safeLinkText}</a></p>`,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend could not send the order status email (HTTP ${response.status}).`);
  }
}
