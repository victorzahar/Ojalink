import { asc, desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { notFound } from "next/navigation";

import {
  AdminDisputeDetail,
  type AdminDisputeDetailRecord,
} from "@/components/admin/admin-dispute-detail";
import { requireRole } from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import {
  disputes,
  orderItems,
  orders,
  payments,
  users,
  vendors,
} from "@/lib/db/schema";

export const instant = false;

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function AdminDisputeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("admin");

  const { id } = await params;
  if (!uuidPattern.test(id)) notFound();

  const db = getDb();
  const disputeRaiser = alias(users, "dispute_raiser");
  const buyer = alias(users, "buyer");
  const vendorOwner = alias(users, "vendor_owner");

  const [row] = await db
    .select({
      disputeId: disputes.id,
      disputeStatus: disputes.status,
      disputeReason: disputes.reason,
      resolutionNote: disputes.resolutionNote,
      disputeCreatedAt: disputes.createdAt,
      raisedByName: disputeRaiser.name,
      orderId: orders.id,
      orderStatus: orders.status,
      subtotalKobo: orders.subtotalKobo,
      deliveryFeeKobo: orders.deliveryFeeKobo,
      platformFeeKobo: orders.platformFeeKobo,
      totalKobo: orders.totalKobo,
      refundKobo: orders.refundKobo,
      refundedAt: orders.refundedAt,
      buyerName: buyer.name,
      buyerEmail: buyer.email,
      buyerPhone: buyer.phone,
      vendorShopName: vendors.shopName,
      vendorOwnerName: vendorOwner.name,
    })
    .from(disputes)
    .innerJoin(orders, eq(disputes.orderId, orders.id))
    .innerJoin(disputeRaiser, eq(disputes.raisedBy, disputeRaiser.id))
    .innerJoin(buyer, eq(orders.buyerId, buyer.id))
    .innerJoin(vendors, eq(orders.vendorId, vendors.id))
    .innerJoin(vendorOwner, eq(vendors.userId, vendorOwner.id))
    .where(eq(disputes.id, id))
    .limit(1);

  if (!row) notFound();

  const [items, paymentRows] = await Promise.all([
    db
      .select({
        id: orderItems.id,
        productName: orderItems.productName,
        quantity: orderItems.quantity,
        unitPriceKobo: orderItems.unitPriceKobo,
      })
      .from(orderItems)
      .where(eq(orderItems.orderId, row.orderId))
      .orderBy(asc(orderItems.createdAt)),
    db
      .select({
        status: payments.status,
        amountKobo: payments.amountKobo,
        paidAt: payments.paidAt,
        createdAt: payments.createdAt,
      })
      .from(payments)
      .where(eq(payments.orderId, row.orderId))
      .orderBy(desc(payments.createdAt))
      .limit(1),
  ]);

  const [latestPayment] = paymentRows;
  const record: AdminDisputeDetailRecord = {
    dispute: {
      id: row.disputeId,
      status: row.disputeStatus,
      reason: row.disputeReason,
      resolutionNote: row.resolutionNote,
      createdAt: row.disputeCreatedAt,
      raisedByName: row.raisedByName,
    },
    order: {
      id: row.orderId,
      status: row.orderStatus,
      subtotalKobo: row.subtotalKobo,
      deliveryFeeKobo: row.deliveryFeeKobo,
      platformFeeKobo: row.platformFeeKobo,
      totalKobo: row.totalKobo,
      refundKobo: row.refundKobo,
      refundedAt: row.refundedAt,
    },
    items,
    buyer: {
      name: row.buyerName,
      email: row.buyerEmail,
      phone: row.buyerPhone,
    },
    vendor: {
      shopName: row.vendorShopName,
      ownerName: row.vendorOwnerName,
    },
    payment: latestPayment
      ? {
          status: latestPayment.status,
          amountKobo: latestPayment.amountKobo,
          paidAt: latestPayment.paidAt,
        }
      : null,
  };

  return <AdminDisputeDetail record={record} />;
}
