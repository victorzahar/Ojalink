import type { Metadata } from "next";
import Link from "next/link";
import { and, desc, eq, inArray } from "drizzle-orm";
import { Card, CardContent } from "@/components/ui/card";
import { OrderActions } from "@/components/vendor-orders/order-actions";
import { requireRole } from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import { orders, vendors } from "@/lib/db/schema";
import { formatDateLagos, formatNaira } from "@/lib/orders/format";

// This page reads the session on every request. Block on the server so
// protected content is never served from the static shell or a cache.
export const instant = false;

export const metadata: Metadata = {
  title: "Orders · OjaLink",
  description: "Your OjaLink vendor orders.",
};

// Live status names only. "pending" is deliberately absent: the buyer hasn't paid yet.
const GROUPS = {
  needsAction: { title: "Needs action", statuses: ["paid"] },
  inProgress: { title: "In progress", statuses: ["accepted", "picked_up"] },
  done: { title: "Done", statuses: ["delivered"] },
  history: { title: "History", statuses: ["rejected", "cancelled", "refunded"] },
} as const;

const VISIBLE_STATUSES = Object.values(GROUPS).flatMap((g) => g.statuses);

const STATUS_LABELS: Record<string, string> = {
  paid: "Paid",
  accepted: "Accepted",
  picked_up: "Picked up",
  delivered: "Delivered",
  rejected: "Rejected",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

// History grows forever, so only show the newest few for now.
const HISTORY_LIMIT = 20;

// First 8 characters of the order ID in capitals, e.g. "3F9A1C2B".
function shortRef(id: string) {
  return id.slice(0, 8).toUpperCase();
}

export default async function VendorOrdersPage() {
  const user = await requireRole("vendor"); // admin also passes

  // Admin is the only exception; everyone else sees only their vendor's orders.
  const ownership =
    user.role === "admin" ? undefined : eq(vendors.userId, user.id);

  // Newest first. "Needs action" is flipped below so the longest-waiting order is on top.
  const rows = await getDb()
    .select({
      id: orders.id,
      status: orders.status,
      totalKobo: orders.totalKobo,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .innerJoin(vendors, eq(orders.vendorId, vendors.id))
    .where(and(ownership, inArray(orders.status, VISIBLE_STATUSES)))
    .orderBy(desc(orders.createdAt));

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col gap-6 px-4 py-8">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Vendor area</p>
        <h1 className="font-heading text-[28px] leading-tight font-bold text-foreground">
          Orders
        </h1>
      </div>

      {Object.entries(GROUPS).map(([key, group]) => {
        const matching = rows.filter((r) =>
          (group.statuses as readonly string[]).includes(r.status),
        );
        let shown = key === "needsAction" ? [...matching].reverse() : matching;
        if (key === "history") shown = shown.slice(0, HISTORY_LIMIT);

        return (
          <section key={key} className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold text-foreground">
              {group.title} ({matching.length})
            </h2>
            {shown.length === 0 ? (
              <p className="text-base text-muted-foreground">No orders here.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {shown.map((r) => (
                  <li key={r.id}>
                    <Card size="sm">
                      <CardContent className="flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-base font-semibold text-foreground">
                            Order {shortRef(r.id)}
                          </p>
                          <span className="rounded-full border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground">
                            {STATUS_LABELS[r.status] ?? r.status}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatDateLagos(r.createdAt)}
                        </p>
                        <p className="text-xl font-bold text-foreground">
                          {formatNaira(r.totalKobo)}
                        </p>
                        {r.status === "paid" && <OrderActions orderId={r.id} />}
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}

      <Link
        href="/vendor"
        className="inline-flex min-h-11 items-center font-medium text-primary underline-offset-4 hover:underline"
      >
        ← Back to vendor area
      </Link>
    </main>
  );
}
