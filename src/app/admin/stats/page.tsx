import { and, count, eq, exists, sql } from "drizzle-orm";

import {
  AdminStatsOverview,
  type StatusCount,
} from "@/components/admin/admin-stats-overview";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { requireRole } from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import {
  disputes,
  orderStatusEnum,
  orders,
  payments,
  vendorApprovalStatusEnum,
  vendors,
} from "@/lib/db/schema";

export const instant = false;

export default async function AdminStatsPage() {
  await requireRole("admin");

  const db = getDb();
  const [orderStatusRows, vendorStatusRows, salesRows, openDisputeRows] =
    await Promise.all([
      db
        .select({ status: orders.status, count: count() })
        .from(orders)
        .groupBy(orders.status),
      db
        .select({ status: vendors.approvalStatus, count: count() })
        .from(vendors)
        .groupBy(vendors.approvalStatus),
      db
        .select({
          salesKobo: sql<string>`coalesce(sum(greatest(${orders.totalKobo} - ${orders.refundKobo}, 0)), 0)`,
        })
        .from(orders)
        .where(
          exists(
            db
              .select({ id: payments.id })
              .from(payments)
              .where(
                and(
                  eq(payments.orderId, orders.id),
                  eq(payments.status, "success"),
                ),
              ),
          ),
        ),
      db
        .select({ count: count() })
        .from(disputes)
        .where(eq(disputes.status, "open")),
    ]);

  const orderCounts = new Map(
    orderStatusRows.map(({ status, count: statusCount }) => [status, statusCount]),
  );
  const vendorCounts = new Map(
    vendorStatusRows.map(({ status, count: statusCount }) => [status, statusCount]),
  );

  const ordersByStatus: StatusCount[] = orderStatusEnum.enumValues.map((status) => ({
    status,
    count: orderCounts.get(status) ?? 0,
  }));
  const vendorsByStatus: StatusCount[] = vendorApprovalStatusEnum.enumValues.map(
    (status) => ({
      status,
      count: vendorCounts.get(status) ?? 0,
    }),
  );

  const totalOrders = ordersByStatus.reduce((total, row) => total + row.count, 0);
  const totalVendors = vendorsByStatus.reduce((total, row) => total + row.count, 0);
  const paidSalesKobo = Number(salesRows[0]?.salesKobo ?? 0);
  const openDisputes = openDisputeRows[0]?.count ?? 0;

  return (
    <AdminPageShell
      title="Stats"
      description="Review order, sales, vendor and dispute activity across OjaLink."
    >
      <AdminStatsOverview
        totalOrders={totalOrders}
        paidSalesKobo={paidSalesKobo}
        totalVendors={totalVendors}
        openDisputes={openDisputes}
        ordersByStatus={ordersByStatus}
        vendorsByStatus={vendorsByStatus}
      />
    </AdminPageShell>
  );
}
