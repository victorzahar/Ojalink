"use server";

import { redirect } from "next/navigation";

import { requireCartBuyer } from "@/lib/cart/access";
import { getBuyerPaymentInitializationData } from "@/lib/checkout/queries";
import { buildPaystackCallbackUrl } from "@/lib/payments/callback-url";

function getPaystackErrorMessage(payload: unknown) {
  if (!payload || typeof payload !== "object") return "Invalid or empty JSON response";
  const message = (payload as { message?: unknown }).message;
  return typeof message === "string" ? message : "No message provided";
}

export async function initiatePaystackPayment(formData: FormData) {
  const buyer = await requireCartBuyer();
  const orderId = formData.get("orderId");
  if (typeof orderId !== "string") redirect("/orders");

  const payment = await getBuyerPaymentInitializationData(buyer.id, orderId);
  if (!payment || payment.status !== "pending" || payment.paymentStatus !== "pending") {
    redirect("/orders");
  }
  if (!payment.reservationExpiresAt || payment.reservationExpiresAt.getTime() <= Date.now()) {
    redirect("/checkout/" + orderId + "?payment_error=expired");
  }
  const secretKey = process.env.PAYSTACK_SECRET_KEY?.trim();
  const callbackUrl = buildPaystackCallbackUrl(process.env.BETTER_AUTH_URL, orderId);
  if (!secretKey || !secretKey.startsWith("sk_test_") || !callbackUrl) {
    redirect("/checkout/" + orderId + "?payment_error=setup");
  }
  if (!Number.isSafeInteger(payment.totalKobo) || payment.totalKobo <= 0) {
    console.error("Paystack initialize rejected locally", {
      httpStatus: null,
      status: null,
      message: "Order amount must be a positive safe integer in kobo",
    });
    redirect("/checkout/" + orderId + "?payment_error=init");
  }

  let authorizationUrl: string | undefined;
  try {
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + secretKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: payment.email,
        amount: String(payment.totalKobo),
        currency: "NGN",
        reference: payment.reference,
        callback_url: callbackUrl,
        metadata: { order_id: orderId },
      }),
      cache: "no-store",
    });

    let result: unknown;
    try {
      result = await response.json();
    } catch {
      result = null;
    }
    const payload = result && typeof result === "object"
      ? result as { status?: unknown; data?: { authorization_url?: unknown } }
      : null;
    const apiStatus = typeof payload?.status === "boolean" ? payload.status : null;
    const authorization = payload?.data?.authorization_url;
    if (response.ok && apiStatus === true && typeof authorization === "string") {
      authorizationUrl = authorization;
    } else {
      console.error("Paystack initialize failed", {
        httpStatus: response.status,
        status: apiStatus,
        message: getPaystackErrorMessage(result),
      });
    }
  } catch (error) {
    console.error("Paystack initialize request failed", {
      httpStatus: null,
      status: null,
      message: error instanceof Error ? error.message : "Unknown request error",
    });
  }

  if (!authorizationUrl) redirect("/checkout/" + orderId + "?payment_error=init");
  redirect(authorizationUrl);
}
