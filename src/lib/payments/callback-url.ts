/**
 * Builds the Paystack callback URL for an order.
 *
 * Production must be https. Local development is allowed on http only for
 * localhost/127.0.0.1 — Paystack test mode redirects the developer's own
 * browser back to it, so a local callback works for test checkout.
 */
export function buildPaystackCallbackUrl(baseUrl: string | undefined, orderId: string) {
  if (!baseUrl) return null;

  try {
    const appUrl = new URL(baseUrl);
    const isLocalhost = appUrl.hostname === "localhost" || appUrl.hostname === "127.0.0.1";
    const protocolAllowed = appUrl.protocol === "https:" || (appUrl.protocol === "http:" && isLocalhost);
    if (!protocolAllowed || appUrl.username || appUrl.password) return null;

    return new URL(`/checkout/${encodeURIComponent(orderId)}`, appUrl.origin).toString();
  } catch {
    return null;
  }
}
