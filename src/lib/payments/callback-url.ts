export function buildPaystackCallbackUrl(baseUrl: string | undefined, orderId: string) {
  if (!baseUrl) return null;

  try {
    const appUrl = new URL(baseUrl);
    if (appUrl.protocol !== "https:" || appUrl.username || appUrl.password) return null;

    return new URL(`/checkout/${encodeURIComponent(orderId)}`, appUrl.origin).toString();
  } catch {
    return null;
  }
}
