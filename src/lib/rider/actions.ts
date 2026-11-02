"use server";

import { and, eq, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import { deliveries, orders } from "@/lib/db/schema";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type RiderActionResult =
  | { ok: true; message: string }
  | { ok: false; message: string; status?: number };

const genericError = "Something went wrong. Please try again.";

/**
 * Shared checks for every rider action: signed in, rider role, valid job id.
 * Access control happens here on the server, not in the button.
 */
async function checkRider(deliveryId: unknown) {
  const auth = await requireRole({ api: true }, "rider");
  if (auth instanceof Response) {
    const body = (await auth.json()) as { error?: string };
    return {
      failure: {
        ok: false,
        status: auth.status,
        message: body.error ?? "You do not have access.",
      } satisfies RiderActionResult,
    };
  }

  if (typeof deliveryId !== "string" || !uuidPattern.test(deliveryId)) {
    return {
      failure: {
        ok: false,
        message: "We could not find that delivery.",
      } satisfies RiderActionResult,
    };
  }

  return { riderId: auth.id, deliveryId };
}

function refreshRiderPages() {
  revalidatePath("/rider");
  revalidatePath("/rider/history");
}

/**
 * Take a job. One single UPDATE that only succeeds while the delivery is still
 * `available`, has no rider, and its order is still `accepted` by the vendor.
 * If two riders tap at the same moment, the database lets only one through.
 */
export async function acceptJob(deliveryId: unknown): Promise<RiderActionResult> {
  const checked = await checkRider(deliveryId);
  if (checked.failure) return checked.failure;

  try {
    const [taken] = await getDb()
      .update(deliveries)
      .set({ riderId: checked.riderId, status: "accepted", acceptedAt: new Date() })
      .where(
        and(
          eq(deliveries.id, checked.deliveryId),
          eq(deliveries.status, "available"),
          isNull(deliveries.riderId),
          sql`exists (
            select 1 from ${orders}
            where ${orders.id} = ${deliveries.orderId}
              and ${orders.status} = 'accepted'
          )`,
        ),
      )
      .returning({ id: deliveries.id });

    if (!taken) {
      refreshRiderPages();
      return {
        ok: false,
        status: 409,
        message: "Sorry, another rider just took this job.",
      };
    }

    refreshRiderPages();
    return { ok: true, message: "Job accepted. Go to the market to pick up." };
  } catch {
    return { ok: false, message: genericError };
  }
}

/**
 * accepted -> picked_up. Touches two tables (deliveries and orders), so both
 * UPDATEs go in one db.batch(): Neon runs a batch as a single transaction.
 * The second UPDATE only fires if the first one really moved this rider's job.
 */
export async function markPickedUp(deliveryId: unknown): Promise<RiderActionResult> {
  const checked = await checkRider(deliveryId);
  if (checked.failure) return checked.failure;

  const now = new Date();

  try {
    const db = getDb();
    const [movedDeliveries] = await db.batch([
      db
        .update(deliveries)
        .set({ status: "picked_up", pickedUpAt: now })
        .where(
          and(
            eq(deliveries.id, checked.deliveryId),
            eq(deliveries.riderId, checked.riderId),
            eq(deliveries.status, "accepted"),
          ),
        )
        .returning({ id: deliveries.id }),
      db
        .update(orders)
        .set({ status: "picked_up" })
        .where(
          and(
            eq(orders.status, "accepted"),
            sql`exists (
              select 1 from ${deliveries}
              where ${deliveries.orderId} = ${orders.id}
                and ${deliveries.id} = ${checked.deliveryId}
                and ${deliveries.riderId} = ${checked.riderId}
                and ${deliveries.status} = 'picked_up'
            )`,
          ),
        )
        .returning({ id: orders.id }),
    ]);

    if (movedDeliveries.length === 0) {
      refreshRiderPages();
      return {
        ok: false,
        status: 409,
        message: "This job cannot be marked as picked up. It may already be done.",
      };
    }

    refreshRiderPages();
    return { ok: true, message: "Marked as picked up. Take it to the buyer." };
  } catch {
    return { ok: false, message: genericError };
  }
}

/**
 * picked_up -> delivered. Same one-transaction rule. The server (not the phone)
 * sets delivered_at on both rows with the same timestamp, as money-rules.md
 * requires, because weekly vendor payouts are grouped by orders.delivered_at.
 */
export async function markDelivered(deliveryId: unknown): Promise<RiderActionResult> {
  const checked = await checkRider(deliveryId);
  if (checked.failure) return checked.failure;

  const now = new Date();

  try {
    const db = getDb();
    const [movedDeliveries] = await db.batch([
      db
        .update(deliveries)
        .set({ status: "delivered", deliveredAt: now })
        .where(
          and(
            eq(deliveries.id, checked.deliveryId),
            eq(deliveries.riderId, checked.riderId),
            eq(deliveries.status, "picked_up"),
          ),
        )
        .returning({ id: deliveries.id }),
      db
        .update(orders)
        .set({ status: "delivered", deliveredAt: now })
        .where(
          and(
            eq(orders.status, "picked_up"),
            sql`exists (
              select 1 from ${deliveries}
              where ${deliveries.orderId} = ${orders.id}
                and ${deliveries.id} = ${checked.deliveryId}
                and ${deliveries.riderId} = ${checked.riderId}
                and ${deliveries.status} = 'delivered'
            )`,
          ),
        )
        .returning({ id: orders.id }),
    ]);

    if (movedDeliveries.length === 0) {
      refreshRiderPages();
      return {
        ok: false,
        status: 409,
        message: "This job cannot be marked as delivered. It may already be done.",
      };
    }

    refreshRiderPages();
    return { ok: true, message: "Delivered. Well done!" };
  } catch {
    return { ok: false, message: genericError };
  }
}
